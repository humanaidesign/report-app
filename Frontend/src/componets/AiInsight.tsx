import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import type { Finding } from "../types";

interface AiInsightsProps {
  findings: Finding[];
  selectedFindingId: string | null; 
  onFindingSelect: (id: string) => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const AiInsights: React.FC<AiInsightsProps> = ({
  findings,
  selectedFindingId,
  onFindingSelect,
  onGenerateReport,
  isGeneratingReport,
}) => (
  <Box
    sx={{
      p: 2,
      height: "fit-content",
      minHeight: 300,
      display: "flex",
      flexDirection: "column",
      bgcolor: "#1e1e1e",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
      >
        AI Assistant Insights
      </Typography>
    </Box> 
    <Box sx={{ overflowY: "auto", mb: 2 }}>
      <Stack spacing={1}>
        {findings.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: "#aaa", textAlign: "center", py: 2 }}
          >
            Upload an X-ray to see AI findings
          </Typography>
        ) : (
          findings.map((item) => {
            const isSelected = item.id === selectedFindingId;

            return (
              <Paper
                key={item.id}
                variant="outlined"
                onClick={() => onFindingSelect(item.id)} 
                sx={{
                  p: 1,
                  bgcolor: isSelected
                    ? "rgba(255, 152, 0, 0.15)" 
                    : "rgba(216, 67, 21, 0.05)", 
                  borderColor: isSelected ? "#ff9800" : "#d84315",
                  borderWidth: isSelected ? 2 : 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "white",
                  cursor: "pointer",  
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 152, 0, 0.2)",
                    borderColor: "#ff9800",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                  {item.text}
                </Typography>
                <VisibilityIcon
                  sx={{
                    fontSize: 14,
                    opacity: isSelected ? 1 : 0.6,  
                    color: isSelected ? "#ff9800" : "inherit",
                  }}
                />
              </Paper>
            );
          })
        )}
      </Stack>
    </Box>

    <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
        sx={{ flex: 1, bgcolor: "white", color: "black", fontSize: "0.65rem" }}
        disabled={findings.length === 0}  
      >
        Add
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={onGenerateReport}
        disabled={findings.length === 0 || isGeneratingReport}
        sx={{ flex: 1, bgcolor: "#1976d2", fontSize: "0.65rem" }}
      >
        {isGeneratingReport ? "Generating..." : "Create Report"}
      </Button>
    </Box>
  </Box>
);

export default AiInsights;