import { useCallback, useMemo, useState } from "react";
import { PlagueMap } from "./components/PlagueMap";
import { SearchBar } from "./components/SearchBar";
import { DetailPanel } from "./components/DetailPanel";
import { SourcesDrawer } from "./components/SourcesDrawer";
import { LayerPage, type LayerId } from "./components/LayerPage";
import { Insights } from "./components/Insights";
import { WarMap } from "./components/WarMap";
import { LiveStatus } from "./components/Live";
import { fieldById, jobById } from "./data/dataset";
import {
  connectedFieldIds,
  connectedJobIds,
  connectedSkillIds,
  fieldNodes,
  jobNodes,
  skillNodes,
} from "./lib/derive";
import type { Job, Selection, ViewMode } from "./types";

const VIEWS: { id: ViewMode; label: string; hint: string }[] = [
  { id: "fields", label: "Fields", hint: "Group jobs by industry" },
  { id: "skills", label: "Skills", hint: "Group jobs by the skills they need" },
  { id: "split", label: "Connected", hint: "Fields and Skills side by side; selecting links them" },
  { id: "overview", label: "Overview", hint: "All roles at once: treemap, risk bands, risk vs. outlook" },
  { id: "war", label: "War map", hint: "AI as an invading force: which fields fall first, and where the line holds" },
];

function Legend() {
  return (
    <div className="legend" aria-label="Legend">
      <span><i className="sw low" /> Resilient</span>
      <span><i className="sw mid" /> Exposed</span>
      <span><i className="sw high" /> Severe</span>
      <span><i className="sw aug" /> Augmenting</span>
      <span className="legend-note">Size = workforce · Spore speed = rate of displacement</span>
    </div>
  );
}

/** Optional deep link, e.g. ?view=split&job=paralegal or ?field=tech or ?skill=python */
function initialState() {
  const p = new URLSearchParams(window.location.search);
  const v = p.get("view");
  const view: ViewMode = v === "skills" || v === "split" || v === "overview" || v === "war" ? v : "fields";
  const job = p.get("job");
  const field = p.get("field");
  const skill = p.get("skill");
  const j = job ? jobById(job) : undefined;
  let selection: Selection | null = null;
  let fieldFocus: string | null = null;
  if (j) {
    selection = { type: "job", id: j.id };
    fieldFocus = j.fieldId;
  } else if (field && fieldById(field)) {
    selection = { type: "field", id: field };
    fieldFocus = field;
  } else if (skill) selection = { type: "skill", id: skill };
  const l = p.get("layer");
  const layer: LayerId | null = l === "military" || l === "human" ? l : null;
  return { view, selection, fieldFocus, sources: p.get("sources") === "1", layer };
}

export default function App() {
  const init = useMemo(initialState, []);
  const [view, setView] = useState<ViewMode>(init.view);
  const [fieldFocus, setFieldFocus] = useState<string | null>(init.fieldFocus);
  const [selection, setSelection] = useState<Selection | null>(init.selection);
  const [showSources, setShowSources] = useState(init.sources);
  const [layer, setLayer] = useState<LayerId | null>(init.layer);
  const closeLayer = useCallback(() => setLayer(null), []);
  const closeSources = useCallback(() => setShowSources(false), []);

  const select = useCallback((s: Selection | null) => {
    setSelection(s);
    if (!s) return;
    if (s.type === "field") setFieldFocus(s.id);
    if (s.type === "job") {
      const j = jobById(s.id);
      if (j) setFieldFocus(j.fieldId);
    }
  }, []);

  const onSearch = useCallback((job: Job) => select({ type: "job", id: job.id }), [select]);

  const backToFields = () => {
    setFieldFocus(null);
    setSelection(null);
  };

  const fNodes = useMemo(() => fieldNodes(), []);
  const sNodes = useMemo(() => skillNodes(), []);
  const jNodes = useMemo(() => (fieldFocus ? jobNodes(fieldFocus) : []), [fieldFocus]);

  const fieldHighlight = fieldFocus ? connectedJobIds(selection) : connectedFieldIds(selection);
  const skillHighlight = connectedSkillIds(selection);

  const showFields = view === "fields" || view === "split";
  const showSkills = view === "skills" || view === "split";
  const fieldName = fieldFocus ? fieldById(fieldFocus)?.name : null;

  const fieldSelectedId =
    selection?.type === "job" ? selection.id : selection?.type === "field" && !fieldFocus ? selection.id : null;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Displaced</h1>
          <p>How AI is reshaping work — what's spreading, what survives, where to go next.</p>
        </div>
        <SearchBar onSelect={onSearch} />
        <div className="toggle" role="tablist" aria-label="Display mode">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              title={v.hint}
              className={view === v.id ? "on" : ""}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="layers" role="group" aria-label="Dedicated layers">
          <button onClick={() => setLayer("military")}>Military &amp; Defense</button>
          <button onClick={() => setLayer("human")}>Human skills</button>
          <button onClick={() => setShowSources(true)}>Sources &amp; method</button>
        </div>
        <LiveStatus />
      </header>

      <main className="stage">
        <section className={`panels ${view}`}>
          {view === "war" && (
            <div className="panel panel-scroll">
              <WarMap
                selectedFieldId={
                  selection?.type === "field"
                    ? selection.id
                    : selection?.type === "job"
                      ? (jobById(selection.id)?.fieldId ?? null)
                      : null
                }
                selectedJobId={selection?.type === "job" ? selection.id : null}
                onSelectField={(id) => select({ type: "field", id })}
                onSelectJob={(id) => select({ type: "job", id })}
              />
            </div>
          )}
          {view === "overview" && (
            <div className="panel panel-scroll">
              <Insights
                selectedJobId={selection?.type === "job" ? selection.id : null}
                onSelectJob={(id) => select({ type: "job", id })}
                onSelectField={(id) => select({ type: "field", id })}
              />
            </div>
          )}
          {showFields && (
            <div className="panel">
              <div className="panel-head">
                <h2>
                  {fieldFocus ? (
                    <>
                      <button className="back" onClick={backToFields}>
                        ← All fields
                      </button>
                      <span>{fieldName}</span>
                    </>
                  ) : (
                    "Fields"
                  )}
                </h2>
                <span className="panel-sub">
                  {fieldFocus ? "Roles by displacement risk" : "Click a field to zoom into its roles"}
                </span>
              </div>
              <PlagueMap
                nodes={fieldFocus ? jNodes : fNodes}
                selectedId={fieldSelectedId}
                highlightIds={fieldHighlight}
                focusId={selection?.type === "job" && fieldFocus ? selection.id : null}
                ariaLabel={fieldFocus ? `Roles in ${fieldName}` : "Fields"}
                riskName="Displacement risk"
                onNodeClick={(id) => select({ type: fieldFocus ? "job" : "field", id })}
              />
            </div>
          )}
          {showSkills && (
            <div className="panel">
              <div className="panel-head">
                <h2>Skills</h2>
                <span className="panel-sub">Obsolescence vs. appreciation, technical vs. human</span>
              </div>
              <PlagueMap
                nodes={sNodes}
                selectedId={selection?.type === "skill" ? selection.id : null}
                highlightIds={skillHighlight}
                focusId={selection?.type === "skill" ? selection.id : null}
                ariaLabel="Skills"
                riskName="Automatable"
                groupLabels={{ technical: "Technical skills", human: "Human skills — AI-resistant" }}
                onNodeClick={(id) => select({ type: "skill", id })}
              />
            </div>
          )}
        </section>
        <DetailPanel
          selection={selection}
          onSelect={select}
          onClear={() => setSelection(null)}
          onOpenSources={() => setShowSources(true)}
        />
      </main>
      <Legend />
      {layer && (
        <LayerPage layer={layer} onClose={closeLayer} onSelect={select} onOpenSources={() => setShowSources(true)} />
      )}
      {showSources && <SourcesDrawer onClose={closeSources} />}
    </div>
  );
}
