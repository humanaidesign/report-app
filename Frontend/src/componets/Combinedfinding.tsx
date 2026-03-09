import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { Finding, FindingStatus } from "../types";

interface CombinedPanelProps {
  findings: Finding[];
  selectedFindingId: string | null;
  hiddenFindingIds: Set<string>;
  allBoxesHidden: boolean;
  onFindingSelect: (id: string) => void;
  onRemoveFinding: (id: string) => void;
  onToggleAllBoxes: () => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  reportText: string;
  onReportChange: (text: string) => void;
}

// Abnormal = red/yellow (worsened or changed), Normal = gray (same)
const STATUS_CONFIG: Record<
  "abnormal" | "normal",
  { color: string; bg: string; border: string; label: string; dot: string }
> = {
  abnormal: {
    color: "#ef5350",
    bg: "rgba(239, 83, 80, 0.13)",
    border: "rgba(239, 83, 80, 0.45)",
    label: "Abnormal",
    dot: "#ef5350",
  },
  normal: {
    color: "#90a4ae",
    bg: "rgba(144, 164, 174, 0.1)",
    border: "rgba(144, 164, 174, 0.3)",
    label: "Normal",
    dot: "#90a4ae",
  },
};

function getCategory(status: FindingStatus): "abnormal" | "normal" {
  return status === "worsened" || status === "changed" ? "abnormal" : "normal";
}

function StatusPill({ status }: { status: FindingStatus }) {
  const cat = getCategory(status);
  const cfg = STATUS_CONFIG[cat];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        px: "7px",
        py: "3px",
        borderRadius: "4px",
        bgcolor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </Box>
  );
}

const CombinedPanel: React.FC<CombinedPanelProps> = ({
  findings,
  selectedFindingId,
  hiddenFindingIds,
  allBoxesHidden,
  onFindingSelect,
  onRemoveFinding,
  onToggleAllBoxes,
  onGenerateReport,
  isGeneratingReport,
  reportText,
  onReportChange,
}) => {
  const parseImpression = (text: string): string => {
    if (!text) return "";
    const match = text.match(/Impression:?\s*([\s\S]*?)$/i);
    return match ? match[1].trim() : "";
  };

  const impression = parseImpression(reportText);

  // Sort: abnormal first, then by isCritical
  const sorted = [...findings].sort((a, b) => {
    const aAbnormal = getCategory(a.status ?? "same") === "abnormal" ? 0 : 1;
    const bAbnormal = getCategory(b.status ?? "same") === "abnormal" ? 0 : 1;
    if (aAbnormal !== bAbnormal) return aAbnormal - bAbnormal;
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;
    return 0;
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#161a1d",
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <KeyboardArrowDownIcon sx={{ fontSize: 17, color: "#78909c" }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "#eceff1",
            letterSpacing: "0.02em",
            flex: 1,
          }}
        >
          Radiology Report
        </Typography>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Findings section header ── */}
        <Box
          sx={{
            px: 1.5,
            pt: 1.25,
            pb: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#78909c",
            }}
          >
            Findings
          </Typography>
          {/* Single eye toggle — controls all bounding boxes on X-ray */}
          <IconButton
            size="small"
            onClick={onToggleAllBoxes}
            title={allBoxesHidden ? "Show all bounding boxes" : "Hide all bounding boxes"}
            sx={{
              p: "3px",
              color: allBoxesHidden ? "#2a3540" : "#607d8b",
              "&:hover": { color: "#90a4ae" },
            }}
          >
            {allBoxesHidden ? (
              <VisibilityOffIcon sx={{ fontSize: 16 }} />
            ) : (
              <VisibilityIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>

        {/* ── Finding rows ── */}
        <Box sx={{ px: 1.25, pb: 1 }}>
          <Stack spacing={0.75}>
            {findings.length === 0 ? (
              <Typography
                sx={{
                  color: "#546e7a",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  py: 3,
                }}
              >
                Upload an X-ray to see AI findings
              </Typography>
            ) : (
              sorted.map((item) => {
                const isSelected = item.id === selectedFindingId;
                const status = item.status ?? "same";
                const cat = getCategory(status);
                const cfg = STATUS_CONFIG[cat];

                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    onClick={() => onFindingSelect(item.id)}
                    sx={{
                      px: 1.25,
                      py: 1,
                      bgcolor: isSelected ? cfg.bg : "rgba(255,255,255,0.03)",
                      borderColor: isSelected
                        ? cfg.border
                        : "rgba(255,255,255,0.08)",
                      borderWidth: isSelected ? "1.5px" : "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: cfg.bg,
                        borderColor: cfg.border,
                      },
                    }}
                  >
                    {/* Color bar */}
                    <Box
                      sx={{
                        width: 3,
                        height: 32,
                        borderRadius: 4,
                        bgcolor: cfg.color,
                        flexShrink: 0,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "#cfd8dc",
                        flex: 1,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.text}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusPill status={status} />
                      <IconButton
                        size="small"
                        onClick={() => onRemoveFinding(item.id)}
                        sx={{
                          p: "3px",
                          color: "#37474f",
                          "&:hover": {
                            color: "#ef5350",
                            bgcolor: "rgba(239,83,80,0.08)",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>

        {/* ── Add finding button ── */}
        <Box sx={{ px: 1.25, pb: 1.25 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            disabled={findings.length === 0}
            fullWidth
            sx={{
              fontSize: "0.75rem",
              borderColor: "rgba(255,255,255,0.15)",
              color: "#78909c",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.3)",
                bgcolor: "rgba(255,255,255,0.04)",
              },
            }}
          >
            Add Finding
          </Button>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* ── Impression section ── */}
        <Box sx={{ px: 1.5, pt: 1.25, pb: 0.75 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#78909c",
              mb: 1,
            }}
          >
            Impression
          </Typography>

          {/* Create Report button — above impression */}
          <Button
            variant="contained"
            size="small"
            onClick={onGenerateReport}
            disabled={findings.length === 0 || isGeneratingReport}
            fullWidth
            sx={{
              fontSize: "0.75rem",
              mb: 1,
              bgcolor: "#1565c0",
              "&:hover": { bgcolor: "#1976d2" },
              "&.Mui-disabled": { bgcolor: "#1a2530", color: "#37474f" },
            }}
          >
            {isGeneratingReport ? "Generating..." : "Create Report"}
          </Button>

          {reportText ? (
            <TextField
              multiline
              fullWidth
              value={impression}
              onChange={(e) => {
                const currentFindings = findings.map((f) => f.text).join(". ");
                onReportChange(
                  `Findings:\n${currentFindings}\n\nImpression:\n${e.target.value}`,
                );
              }}
              placeholder="Impression will appear here after generating the report..."
              variant="outlined"
              minRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#eceff1",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                color: "#546e7a",
                fontSize: "0.85rem",
                fontStyle: "italic",
                py: 2,
                textAlign: "center",
              }}
            >
              Click "Create Report" to generate an impression
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Footer actions ── */}
      <Box
        sx={{
          px: 1.25,
          py: 1.25,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          disabled={!reportText}
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            borderColor: "rgba(255,255,255,0.15)",
            color: "#78909c",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.3)",
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
        >
          Save Draft
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={!reportText}
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            bgcolor: "#1565c0",
            "&:hover": { bgcolor: "#1976d2" },
            "&.Mui-disabled": { bgcolor: "#1a2530", color: "#37474f" },
          }}
        >
          Submit Report
        </Button>
      </Box>
    </Box>
  );
};

export default CombinedPanel;