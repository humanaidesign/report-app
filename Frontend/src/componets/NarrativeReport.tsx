import { Box, Typography, Paper, Button, TextField } from "@mui/material";

interface NarrativeReportProps {
  reportText: string;
  onReportChange: (text: string) => void;
}

const NarrativeReport: React.FC<NarrativeReportProps> = ({
  reportText,
  onReportChange,
}) => {
  const parseReport = (text: string) => {
    if (!text) return { findings: "", impression: "" };

    const findingsMatch = text.match(
      /Findings:?\s*([\s\S]*?)(?=Impression:|$)/i,
    );
    const impressionMatch = text.match(/Impression:?\s*([\s\S]*?)$/i);

    return {
      findings: findingsMatch ? findingsMatch[1].trim() : text,
      impression: impressionMatch ? impressionMatch[1].trim() : "",
    };
  };

  const { findings, impression } = parseReport(reportText);

  return (
    <Box
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="overline" sx={{ color: "#aaa", fontWeight: "bold" }}>
        Report
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: 3,
          bgcolor: "transparent",
          borderColor: "#444",
          color: "#ccc",
          overflowY: "auto",
        }}
      >
        {reportText ? (
          <>
            <Typography
              variant="subtitle2"
              sx={{ color: "white", mb: 1, fontWeight: "bold" }}
            >
              Findings
            </Typography>
            <TextField
              multiline
              fullWidth
              value={findings}
              onChange={(e) => {
                const newReport = `Findings:\n${e.target.value}\n\nImpression:\n${impression}`;
                onReportChange(newReport);
              }}
              variant="outlined"
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  color: "#ccc",
                  "& fieldset": { borderColor: "#444" },
                  "&:hover fieldset": { borderColor: "#666" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
            />

            <Typography
              variant="subtitle2"
              sx={{ color: "white", mb: 1, fontWeight: "bold" }}
            >
              Impression
            </Typography>
            <TextField
              multiline
              fullWidth
              value={impression}
              onChange={(e) => {
                const newReport = `Findings:\n${findings}\n\nImpression:\n${e.target.value}`;
                onReportChange(newReport);
              }}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#ccc",
                  "& fieldset": { borderColor: "#444" },
                  "&:hover fieldset": { borderColor: "#666" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
            />
          </>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "#666", textAlign: "center", py: 4 }}
          >
            Click "Create Report" to generate a narrative report from AI
            findings
          </Typography>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          sx={{ bgcolor: "#444" }}
          disabled={!reportText}
        >
          Save Draft
        </Button>
        <Button variant="contained" size="small" disabled={!reportText}>
          Submit Report
        </Button>
      </Box>
    </Box>
  );
};

export default NarrativeReport;
