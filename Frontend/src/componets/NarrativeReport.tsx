import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
} from "@mui/material";
import type { Finding, FindingStatus } from "../types";

interface NarrativeReportProps {
  findings: Finding[];
  selectedFindingId: string | null;
  reportText: string;
  onReportChange: (text: string) => void;
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  worsened: {
    color: "#ef5350",
    bg: "rgba(239, 83, 80, 0.13)",
    border: "rgba(239, 83, 80, 0.45)",
    label: "Worsened",
  },
  changed: {
    color: "#ffb300",
    bg: "rgba(255, 179, 0, 0.13)",
    border: "rgba(255, 179, 0, 0.45)",
    label: "Changed",
  },
  same: {
    color: "#90a4ae",
    bg: "rgba(144, 164, 174, 0.1)",
    border: "rgba(144, 164, 174, 0.3)",
    label: "Same",
  },
};

const STATUS_RANK: Record<FindingStatus, number> = {
  worsened: 0,
  changed: 1,
  same: 2,
};

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (
    t.includes("pleural") ||
    t.includes("lobe") ||
    t.includes("lung") ||
    t.includes("opacity") ||
    t.includes("pneumo") ||
    t.includes("consolidat")
  )
    return "Lungs";
  if (
    t.includes("cardiac") ||
    t.includes("cardiomegaly") ||
    t.includes("heart") ||
    t.includes("pericardial")
  )
    return "Heart";
  if (t.includes("aortic") || t.includes("mediastin") || t.includes("vascular"))
    return "Vascular";
  if (
    t.includes("spine") ||
    t.includes("thoracic") ||
    t.includes("osseous") ||
    t.includes("bone") ||
    t.includes("rib")
  )
    return "Skeletal";
  if (t.includes("calcif")) return "Calcification";
  return "General";
}

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
          bgcolor: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </Box>
  );
}

interface GroupedFinding {
  id: string;
  text: string;
  status: FindingStatus;
}

function StructuredFindingsSection({
  findings,
  selectedFindingId,
}: {
  findings: Finding[];
  selectedFindingId: string | null;
}) {
  if (findings.length === 0) {
    return (
      <Typography
        sx={{
          color: "#546e7a",
          fontSize: "0.85rem",
          textAlign: "center",
          py: 3,
        }}
      >
        Upload an X-ray to see findings
      </Typography>
    );
  }

  const source = selectedFindingId
    ? findings.filter((f) => f.id === selectedFindingId)
    : findings;

  const grouped = source.reduce<Record<string, GroupedFinding[]>>((acc, f) => {
    const category = inferCategory(f.text);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ id: f.id, text: f.text, status: f.status ?? "same" });
    return acc;
  }, {});

  const categoryOrder = [
    "Lungs",
    "Heart",
    "Vascular",
    "Skeletal",
    "Calcification",
    "General",
  ];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sortedCategories.map((category) => {
        const items = [...grouped[category]].sort(
          (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
        );
        return (
          <Box key={category}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#78909c",
                mb: 0.75,
              }}
            >
              {category}
            </Typography>
            <Stack spacing={0.75}>
              {items.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      p: "9px 12px",
                      borderRadius: "6px",
                      bgcolor: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 3,
                        minHeight: 18,
                        borderRadius: 4,
                        bgcolor: cfg.color,
                        flexShrink: 0,
                        mt: "3px",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        color: "#cfd8dc",
                        flex: 1,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </Typography>
                    <StatusPill status={item.status} />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

const NarrativeReport: React.FC<NarrativeReportProps> = ({
  findings,
  selectedFindingId,
  reportText,
  onReportChange,
}) => {
  const parseImpression = (text: string): string => {
    if (!text) return "";
    const match = text.match(/Impression:?\s*([\s\S]*?)$/i);
    return match ? match[1].trim() : "";
  };

  const impression = parseImpression(reportText);

  return (
    <Box
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#78909c",
          mb: 1.25,
        }}
      >
        Report
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: 2.5,
          bgcolor: "#161a1d",
          borderColor: "rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          gap: 0,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#90a4ae",
              }}
            >
              Findings
            </Typography>
            <Typography
              sx={{
                fontSize: "0.68rem",
                color: "#546e7a",
                fontStyle: "italic",
              }}
            >
              {selectedFindingId ? "filtered by selection" : "read-only"}
            </Typography>
          </Box>
          <StructuredFindingsSection
            findings={findings}
            selectedFindingId={selectedFindingId}
          />
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />

        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#90a4ae",
              mb: 1.25,
            }}
          >
            Impression
          </Typography>

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
      </Paper>

      <Box
        sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end", gap: 0.75 }}
      >
        <Button
          variant="outlined"
          size="small"
          disabled={!reportText}
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
          Save Draft
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={!reportText}
          sx={{
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

export default NarrativeReport;
