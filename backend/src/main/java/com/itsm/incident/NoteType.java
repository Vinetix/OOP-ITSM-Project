package com.itsm.incident;

public enum NoteType {
    COMMENT,        // reporter or admin adds information
    WORK_NOTE,      // assigned technician's investigation note
    INFO_REQUEST,   // technician asks the reporter a question
    INFO_RESPONSE,  // reporter answers
    REOPEN          // reporter's reason for rejecting a resolution
}
