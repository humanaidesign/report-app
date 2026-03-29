import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Drawer,
  Typography,
  IconButton,
  Button,
  Divider,
  Tooltip,
  Chip,
} from "@mui/material";
import Header from "./componets/Header";
import XRayViewer from "./componets/XRayView";
import PatientContextBar from "./componets/PatientInfo";
import CombinedPanel from "./componets/Combinedfinding";
import { useState, useCallback } from "react";
import type { Finding } from "./types";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RadioIcon from "@mui/icons-material/RadioOutlined";

import fibrosis from "./assets/Reticular shadowing - Fibrosis.png";
import tb from "./assets/Chest TB.png";
import lungTumor from "./assets/Lung Tumor.png";

interface XRaySession {
  id: string;
  patientName: string;
  imageUrl: string;
  findings: Finding[];
  report: string;
  createdAt: Date;
  isPreset?: boolean;
  patient: {
    name: string;
    age: number;
    gender: "M" | "F";
    indication: string;
  };
}

const PRESET_SESSIONS: XRaySession[] = [
  {
    id: "preset-1",
    isPreset: true,
    patientName: "Patient A — Fibrosis",
    imageUrl: fibrosis,
    createdAt: new Date("2024-10-12T09:00:00"),
    patient: {
      name: "Patient A",
      age: 67,
      gender: "F",
      indication: "67F with progressive exertional dyspnoea and dry cough",
    },
    findings: [
      {
        id: "1",
        text: "Right basal peripheral fibrosis — reticular shadowing",
        isCritical: false,
        status: "changed",
        boundingBox: { x: 100, y: 150, width: 175, height: 600 },
      },
      {
        id: "2",
        text: "Left basal peripheral fibrosis — reticular shadowing",
        isCritical: false,
        status: "changed",
        boundingBox: { x: 800, y: 150, width: 175, height: 600 },
      },
      {
        id: "3",
        text: "Shaggy / indistinct cardiac borders bilaterally",
        isCritical: false,
        status: "same",
        boundingBox: { x: 350, y: 350, width: 400, height: 420 },
      },
    ],
    report: `Findings:
There is bilateral peripheral reticular (net-like) shadowing most prominent at the lung bases, in keeping with pulmonary fibrosis. The cardiac borders appear indistinct or 'shaggy' bilaterally, a recognised feature of adjacent pulmonary fibrosis. There is mild bibasal volume loss. The upper zones appear relatively preserved. No pleural effusion or pneumothorax identified.

Impression:
1. Bilateral basal-predominant reticular shadowing consistent with pulmonary fibrosis (UIP/IIP pattern).
2. Shaggy cardiac borders secondary to adjacent fibrotic change.
3. HRCT chest recommended for further characterisation and disease progression monitoring.`,
  },
  {
    id: "preset-2",
    isPreset: true,
    patientName: "Patient B — Primary TB",
    imageUrl: tb,
    createdAt: new Date("2024-10-15T11:30:00"),
    patient: {
      name: "Patient B",
      age: 28,
      gender: "M",
      indication:
        "28M with 3-week history of productive cough, night sweats and weight loss",
    },
    findings: [
      {
        id: "1",
        text: "Right upper zone consolidation",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 170, y: 150, width: 230, height: 200 },
      },
      {
        id: "2",
        text: "Right hilar enlargement — ipsilateral lymphadenopathy",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 200, y: 400, width: 200, height: 200 },
      },
    ],
    report: `Findings:
There is consolidation of the right upper zone with associated ipsilateral right hilar enlargement consistent with lymphadenopathy. No cavitation is identified within the consolidation. The left lung is clear. The cardiac silhouette is normal in size and contour. No pleural effusion identified. The bony thorax is unremarkable.

Impression:
1. Right upper zone consolidation with ipsilateral hilar lymphadenopathy — appearances are typical of primary pulmonary tuberculosis.
2. No cavitation to suggest post-primary or reactivation TB at this time.
3. Urgent sputum AFB smear and culture recommended. Isolation precautions advised pending microbiological confirmation.
Note: Chest X-ray may be normal in primary TB; a normal film does not exclude the diagnosis.`,
  },
  {
    id: "preset-3",
    isPreset: true,
    patientName: "Patient C — Lung Tumour",
    imageUrl: lungTumor,
    createdAt: new Date("2024-10-18T14:15:00"),
    patient: {
      name: "Patient C",
      age: 61,
      gender: "M",
      indication:
        "61M with haemoptysis and 6-week history of progressive breathlessness",
    },
    findings: [
      {
        id: "1",
        text: "Large right middle zone mass — primary lung malignancy",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 160, y: 290, width: 250, height: 290 },
      },
      {
        id: "2",
        text: "Left upper zone nodule — suspected metastasis",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 675, y: 375, width: 90, height: 80 },
      },
      {
        id: "3",
        text: "Left mid zone nodule — suspected metastasis",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 800, y: 620, width: 90, height: 90 },
      },
      {
        id: "4",
        text: "Right costophrenic nodule — suspected metastasis",
        isCritical: true,
        status: "worsened",
        boundingBox: { x: 120, y: 885, width: 90, height: 80 },
      },
    ],
    report: `Findings:
There is a large mass in the right middle zone. Multiple bilateral pulmonary nodules are present, including in the left upper zone, left mid zone, and right costophrenic region, consistent with intrapulmonary metastases. The left lung is otherwise clear. No pleural effusion identified. The cardiac silhouette and mediastinum appear within normal limits. The bony thorax shows no lytic or sclerotic lesions.

Impression:
1. Large right middle zone lung mass — primary bronchogenic carcinoma must be excluded; urgent CT chest/abdomen/pelvis and tissue biopsy recommended.
2. Multiple bilateral pulmonary nodules consistent with intrapulmonary metastases (lung-to-lung spread).
3. Urgent respiratory oncology referral indicated.
4. Staging workup required prior to treatment planning.`,
  },
];

const darkTheme = createTheme({ palette: { mode: "dark" } });

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessions, setSessions] = useState<XRaySession[]>(PRESET_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    PRESET_SESSIONS[0].id,
  );
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    PRESET_SESSIONS[0].findings[0]?.id ?? null,
  );
  const [hiddenFindingIds, setHiddenFindingIds] = useState<Set<string>>(
    new Set(),
  );
  const [allBoxesHidden, setAllBoxesHidden] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  const updateActiveSession = useCallback(
    (patch: Partial<Omit<XRaySession, "id">>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, ...patch } : s)),
      );
    },
    [activeSessionId],
  );

  const switchToSession = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    setActiveSessionId(id);
    setSelectedFindingId(target?.findings[0]?.id ?? null);
    setHiddenFindingIds(new Set());
    setAllBoxesHidden(false);
    setDrawerOpen(false);
  };

  const createNewSession = () => {
    const id = String(Date.now());
    const newSession: XRaySession = {
      id,
      patientName: "New Patient",
      imageUrl: "",
      findings: [],
      report: "",
      createdAt: new Date(),
      isPreset: false,
      patient: {
        name: "New Patient",
        age: 0,
        gender: "M",
        indication: "Pending upload",
      },
    };
    setSessions((prev) => [...prev, newSession]);
    switchToSession(id);
  };

  const handleImageUpload = async (file: File) => {
    let sessionId = activeSessionId;

    if (activeSession?.isPreset) {
      sessionId = String(Date.now());
      const newSession: XRaySession = {
        id: sessionId,
        patientName: "Uploaded Patient",
        imageUrl: "",
        findings: [],
        report: "",
        createdAt: new Date(),
        isPreset: false,
        patient: {
          name: "Uploaded Patient",
          age: 0,
          gender: "M",
          indication: "Pending analysis",
        },
      };
      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(sessionId);
    }

    const imagePreviewUrl = URL.createObjectURL(file);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, imageUrl: imagePreviewUrl, findings: [], report: "" }
          : s,
      ),
    );

    setIsAnalyzing(true);
    setHiddenFindingIds(new Set());
    setAllBoxesHidden(false);
    setSelectedFindingId(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/analyze-xray", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        console.error("Analysis error:", data.error);
        alert("Failed to analyze X-ray. Please try again.");
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, findings: [] } : s)),
        );
      } else {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, findings: data } : s)),
        );
        if (data.length > 0) setSelectedFindingId(data[0].id);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Make sure the backend is running.");
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, findings: [] } : s)),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFindingSelect = (id: string) =>
    setSelectedFindingId((prev) => (prev === id ? null : id));

  const handleRemoveFinding = (id: string) => {
    updateActiveSession({
      findings: (activeSession?.findings ?? []).filter((f) => f.id !== id),
    });
    if (selectedFindingId === id) setSelectedFindingId(null);
  };

  const handleToggleAllBoxes = () => setAllBoxesHidden((prev) => !prev);

  const handleAddFinding = (text: string, isAbnormal: boolean) => {
    const newFinding: Finding = {
      id: String(Date.now()),
      text,
      isCritical: false,
      status: isAbnormal ? "worsened" : "same",
    };
    updateActiveSession({
      findings: [...(activeSession?.findings ?? []), newFinding],
    });
    setSelectedFindingId(newFinding.id);
  };

  const handleGenerateReport = async () => {
    const findings = activeSession?.findings ?? [];
    if (findings.length === 0) {
      alert("No findings to generate report from");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(findings),
        },
      );
      const data = await response.json();
      if (data.report) {
        updateActiveSession({ report: data.report });
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate report. Make sure the backend is running.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.find((s) => s.id === id)?.isPreset) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) switchToSession(PRESET_SESSIONS[0].id);
  };

  const findings = activeSession?.findings ?? [];
  const imageUrl = activeSession?.imageUrl ?? "";
  const generatedReport = activeSession?.report ?? "";
  const currentPatient = activeSession?.patient ?? {
    name: "Unknown",
    age: 0,
    gender: "M" as const,
    indication: "",
  };

  const presetList = sessions.filter((s) => s.isPreset);
  const uploadedList = sessions.filter((s) => !s.isPreset);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 288,
            bgcolor: "#0f1419",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RadioIcon sx={{ fontSize: 18, color: "#1976d2" }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.9rem",
                color: "#eceff1",
                letterSpacing: "0.03em",
              }}
            >
              X-Ray Sessions
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            sx={{ color: "#546e7a", p: "4px" }}
          >
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<AddIcon sx={{ fontSize: 15 }} />}
            onClick={createNewSession}
            sx={{
              fontSize: "0.78rem",
              borderColor: "rgba(25,118,210,0.45)",
              color: "#42a5f5",
              py: 0.75,
              "&:hover": {
                borderColor: "#1976d2",
                bgcolor: "rgba(25,118,210,0.08)",
              },
            }}
          >
            New Upload Session
          </Button>
        </Box>

        <Divider
          sx={{ borderColor: "rgba(255,255,255,0.06)", flexShrink: 0 }}
        />

        <Box sx={{ flex: 1, overflowY: "auto", py: 0.75 }}>
          <Typography
            sx={{
              px: 2,
              pt: 0.75,
              pb: 0.5,
              fontSize: "0.64rem",
              fontWeight: 800,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "#37474f",
            }}
          >
            Example Cases
          </Typography>

          {presetList.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => switchToSession(session.id)}
              onDelete={null}
            />
          ))}

          {uploadedList.length > 0 && (
            <>
              <Divider
                sx={{ borderColor: "rgba(255,255,255,0.06)", my: 0.75 }}
              />
              <Typography
                sx={{
                  px: 2,
                  pb: 0.5,
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: "#37474f",
                }}
              >
                Uploaded
              </Typography>
              {uploadedList.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => switchToSession(session.id)}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              ))}
            </>
          )}
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.68rem", color: "#2a3f50" }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} loaded
          </Typography>
        </Box>
      </Drawer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "#121212",
        }}
      >
        <Header
          doctorName="John Doe, MD"
          onMenuClick={() => setDrawerOpen(true)}
        />

        <Box
          sx={{ display: "flex", flex: 1, overflow: "hidden", p: 1, gap: 1 }}
        >
          <Box
            sx={{
              flex: "1 1 62%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: 0,
            }}
          >
            <PatientContextBar patient={currentPatient} />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <XRayViewer
                imageUrl={imageUrl}
                findings={findings}
                selectedFindingId={selectedFindingId}
                hiddenFindingIds={hiddenFindingIds}
                allBoxesHidden={allBoxesHidden}
                onFindingClick={handleFindingSelect}
                onImageUpload={handleImageUpload}
                isAnalyzing={isAnalyzing}
              />
            </Box>
          </Box>

          <Box
            sx={{
              mt: 6,
              flex: "0 0 38%",
              maxHeight: "100%",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <CombinedPanel
              findings={findings}
              selectedFindingId={selectedFindingId}
              hiddenFindingIds={hiddenFindingIds}
              allBoxesHidden={allBoxesHidden}
              onFindingSelect={handleFindingSelect}
              onRemoveFinding={handleRemoveFinding}
              onToggleAllBoxes={handleToggleAllBoxes}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
              reportText={generatedReport}
              onReportChange={(text) => updateActiveSession({ report: text })}
              onAddFinding={handleAddFinding}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

interface SessionRowProps {
  session: XRaySession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (() => void) | null;
}

function SessionRow({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionRowProps) {
  const findingCount = session.findings.length;
  const timeLabel = session.createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = session.createdAt.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <Box
      onClick={onSelect}
      sx={{
        mx: 1,
        mb: 0.5,
        px: 1.25,
        py: 1.1,
        borderRadius: "8px",
        cursor: "pointer",
        bgcolor: isActive ? "rgba(25,118,210,0.15)" : "transparent",
        border: isActive
          ? "1px solid rgba(25,118,210,0.4)"
          : "1px solid transparent",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        "&:hover": {
          bgcolor: isActive
            ? "rgba(25,118,210,0.18)"
            : "rgba(255,255,255,0.04)",
          border: isActive
            ? "1px solid rgba(25,118,210,0.5)"
            : "1px solid rgba(255,255,255,0.06)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "6px",
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: "#1a2530",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {session.imageUrl ? (
          <img
            src={session.imageUrl}
            alt="thumb"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <RadioIcon sx={{ fontSize: 20, color: "#2a3f50" }} />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: isActive ? "#90caf9" : "#b0bec5",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {session.patientName}
          </Typography>
          {session.isPreset && (
            <Chip
              label="demo"
              size="small"
              sx={{
                height: 14,
                fontSize: "0.55rem",
                fontWeight: 700,
                bgcolor: "rgba(25,118,210,0.18)",
                color: "#42a5f5",
                border: "1px solid rgba(25,118,210,0.3)",
                "& .MuiChip-label": { px: "5px" },
              }}
            />
          )}
        </Box>
        <Typography sx={{ fontSize: "0.7rem", color: "#455a64", mt: 0.25 }}>
          {dateLabel} · {timeLabel}
        </Typography>
        {findingCount > 0 && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              mt: 0.4,
              px: "6px",
              py: "1px",
              borderRadius: "4px",
              bgcolor: "rgba(239,83,80,0.12)",
              border: "1px solid rgba(239,83,80,0.25)",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.64rem",
                color: "#ef9a9a",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {findingCount} finding{findingCount !== 1 ? "s" : ""}
            </Typography>
          </Box>
        )}
      </Box>

      {onDelete && (
        <Tooltip title="Remove session" placement="right">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              p: "3px",
              color: "#2a3f50",
              flexShrink: 0,
              "&:hover": { color: "#ef5350", bgcolor: "rgba(239,83,80,0.08)" },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default App;
