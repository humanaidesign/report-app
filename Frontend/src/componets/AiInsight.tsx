import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { Finding, FindingStatus } from "../types";

interface AiInsightsProps {
  findings: Finding[];
  selectedFindingId: string | null;
  hiddenFindingIds: Set<string>;
  onFindingSelect: (id: string) => void;
  onRemoveFinding: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { color: string; bg: string; border: string; label: string; dot: string }
> = {
  worsened: {
    color: "#ef5350",
    bg: "rgba(239, 83, 80, 0.13)",
    border: "rgba(239, 83, 80, 0.45)",
    label: "Worsened",
    dot: "#ef5350",
  },
  changed: {
    color: "#ffb300",
    bg: "rgba(255, 179, 0, 0.13)",
    border: "rgba(255, 179, 0, 0.45)",
    label: "Changed",
    dot: "#ffb300",
  },
  same: {
    color: "#90a4ae",
    bg: "rgba(144, 164, 174, 0.1)",
    border: "rgba(144, 164, 174, 0.3)",
    label: "Same",
    dot: "#90a4ae",
  },
};

const STATUS_RANK: Record<FindingStatus, number> = {
  worsened: 0,
  changed: 1,
  same: 2,
};

function StatusPill({ status }: { status: FindingStatus }) {
  const cfg = STATUS_CONFIG[status];
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

const AiInsights: React.FC<AiInsightsProps> = ({
  findings,
  selectedFindingId,
  hiddenFindingIds,
  onFindingSelect,
  onRemoveFinding,
  onToggleVisibility,
  onGenerateReport,
  isGeneratingReport,
}) => {
  const sorted = [...findings].sort((a, b) => {
    const ra = STATUS_RANK[a.status ?? "same"];
    const rb = STATUS_RANK[b.status ?? "same"];
    if (ra !== rb) return ra - rb;
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
      }}
    >
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
          }}
        >
          AI Assistant Insights
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ px: 1.25, pt: 1.25, pb: 1 }}>
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
                const isHidden = hiddenFindingIds.has(item.id);
                const status = item.status ?? "same";
                const cfg = STATUS_CONFIG[status];

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
                      opacity: isHidden ? 0.3 : 1,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: cfg.bg,
                        borderColor: cfg.border,
                        opacity: isHidden ? 0.4 : 1,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${cfg.color}`,
                        bgcolor: isSelected ? cfg.color : "transparent",
                        color: isSelected ? "#fff" : cfg.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {item.id}
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "#cfd8dc",
                        flex: 1,
                        lineHeight: 1.35,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
                        onClick={() => onToggleVisibility(item.id)}
                        sx={{
                          p: "3px",
                          color: isHidden ? "#2a3540" : "#607d8b",
                          "&:hover": { color: "#90a4ae" },
                        }}
                      >
                        {isHidden ? (
                          <VisibilityOffIcon sx={{ fontSize: 15 }} />
                        ) : (
                          <VisibilityIcon sx={{ fontSize: 15 }} />
                        )}
                      </IconButton>
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
      </Box>

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
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          disabled={findings.length === 0}
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
          Add
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onGenerateReport}
          disabled={findings.length === 0 || isGeneratingReport}
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            bgcolor: "#1565c0",
            "&:hover": { bgcolor: "#1976d2" },
            "&.Mui-disabled": { bgcolor: "#1a2530", color: "#37474f" },
          }}
        >
          {isGeneratingReport ? "Generating..." : "Create Report"}
        </Button>
      </Box>
    </Box>
  );
};

export default AiInsights;
