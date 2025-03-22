import React from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Attachment as AttachmentIcon,
  FileUpload as UploadIcon
} from '@mui/icons-material';

const AttachmentManager = ({ attachments, onAdd, onRemove }) => {
  if (!attachments) {
    return null;
  }

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={onAdd}
        sx={{ mb: 2 }}
      >
        Add Attachment
      </Button>
      
      {attachments.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No attachments added yet. Click the button above to add PDF attachments.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <List dense>
            {attachments.map((attachment, index) => (
              <React.Fragment key={attachment.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <AttachmentIcon color="action" sx={{ mr: 2 }} />
                  <ListItemText
                    primary={attachment.name}
                    secondary={`Added from: ${attachment.path || 'Unknown path'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => onRemove(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      <Typography variant="caption" color="text.secondary">
        Note: Only PDF files are supported as attachments. These will be merged with the final certificate.
      </Typography>
    </Box>
  );
};

export default AttachmentManager;
