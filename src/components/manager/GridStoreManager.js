/**
 * GridStoreManager
 * Manages data persistence, change tracking, and local state
 */
export class GridStoreManager {
  constructor(grid) {
    this.grid = grid;
    
    // Change tracking
    this._changes = []; // Array of change objects
    this._addedRows = new Set(); // Row indices of newly added rows
    this._deletedRows = new Map(); // Map of deleted row index -> row data
    this._modifiedCells = new Map(); // Map of "rowIndex:colKey" -> { oldValue, newValue }
    
    this._tempIdCounter = 0;
  }

  /**
   * Update a cell value and track the change
   */
  updateCell(rowIndex, colKey, newValue) {
    const row = this.grid.data[rowIndex];
    if (!row) {
      console.error('Row not found:', rowIndex);
      return false;
    }

    const oldValue = row[colKey];
    
    // Update the value
    row[colKey] = newValue;
    
    // Track the change
    const changeKey = `${rowIndex}:${colKey}`;
    
    // If this is a newly added row, don't track individual cell changes
    if (!this._addedRows.has(rowIndex)) {
      if (!this._modifiedCells.has(changeKey)) {
        // First time modifying this cell
        this._modifiedCells.set(changeKey, { 
          rowIndex, 
          colKey, 
          oldValue, 
          newValue,
          timestamp: Date.now()
        });
      } else {
        // Update existing modification
        const existing = this._modifiedCells.get(changeKey);
        existing.newValue = newValue;
        existing.timestamp = Date.now();
      }
    }

    // Mark row as modified
    if (!row._isNew) {
      row._modified = true;
    }

    return true;
  }

  /**
   * Add a new row
   */
  addNewRow(rowData = {}) {
    const newRow = {
      ...this.createEmptyRow(),
      ...rowData,
      _id: this.generateTempId(),
      _isNew: true,
      _modified: false
    };

    this.grid.data.push(newRow);
    this._addedRows.add(this.grid.data.length - 1);

    return newRow;
  }

  /**
   * Create empty row with default values
   */
  createEmptyRow() {
    const row = {};
    
    this.grid.columns.forEach(col => {
      if (!col.actionComponent) {
        row[col.key] = this.getDefaultValue(col);
      }
    });

    return row;
  }

  /**
   * Get default value for column type
   */
  getDefaultValue(column) {
    if (column.editor === 'checkbox') {
      return false;
    } else if (column.editor === 'number') {
      return 0;
    } else if (column.editor === 'date') {
      return null;
    } else {
      return '';
    }
  }

  /**
   * Delete a row
   */
  deleteRow(rowIndex) {
    const row = this.grid.data[rowIndex];
    if (!row) return false;

    // If it's a newly added row, just remove it
    if (this._addedRows.has(rowIndex)) {
      this._addedRows.delete(rowIndex);
      this.grid.data.splice(rowIndex, 1);
      
      // Update indices in addedRows
      const updatedAddedRows = new Set();
      this._addedRows.forEach(index => {
        if (index > rowIndex) {
          updatedAddedRows.add(index - 1);
        } else {
          updatedAddedRows.add(index);
        }
      });
      this._addedRows = updatedAddedRows;
    } else {
      // Mark existing row as deleted
      this._deletedRows.set(rowIndex, { ...row });
      row._deleted = true;
    }

    return true;
  }

  /**
   * Undo a cell edit
   */
  undoCellEdit(rowIndex, colKey) {
    const changeKey = `${rowIndex}:${colKey}`;
    const change = this._modifiedCells.get(changeKey);
    
    if (!change) return false;

    const row = this.grid.data[rowIndex];
    if (row) {
      row[colKey] = change.oldValue;
      this._modifiedCells.delete(changeKey);
      
      // Check if row still has modifications
      const hasOtherChanges = Array.from(this._modifiedCells.keys())
        .some(key => key.startsWith(`${rowIndex}:`));
      
      if (!hasOtherChanges) {
        row._modified = false;
      }
    }

    return true;
  }

  /**
   * Undo row addition
   */
  undoAddRow(rowIndex) {
    if (!this._addedRows.has(rowIndex)) return false;

    this._addedRows.delete(rowIndex);
    this.grid.data.splice(rowIndex, 1);

    return true;
  }

  /**
   * Undo row deletion
   */
  undoDeleteRow(rowIndex, rowData) {
    this._deletedRows.delete(rowIndex);
    
    // Restore the row
    if (rowData) {
      delete rowData._deleted;
      this.grid.data.splice(rowIndex, 0, rowData);
    }

    return true;
  }

  /**
   * Get all modified records
   */
  getModifiedRecords() {
    const modified = [];
    const processedRows = new Set();

    // Get modified cells grouped by row
    this._modifiedCells.forEach((change, key) => {
      const rowIndex = change.rowIndex;
      
      if (!processedRows.has(rowIndex) && !this._addedRows.has(rowIndex)) {
        const row = this.grid.data[rowIndex];
        if (row && !row._deleted) {
          modified.push({ ...row });
          processedRows.add(rowIndex);
        }
      }
    });

    return modified;
  }

  /**
   * Get all added records
   */
  getAddedRecords() {
    const added = [];
    
    this._addedRows.forEach(rowIndex => {
      const row = this.grid.data[rowIndex];
      if (row) {
        const cleanRow = { ...row };
        delete cleanRow._id;
        delete cleanRow._isNew;
        delete cleanRow._modified;
        added.push(cleanRow);
      }
    });

    return added;
  }

  /**
   * Get all deleted records
   */
  getDeletedRecords() {
    const deleted = [];
    
    this._deletedRows.forEach((row, rowIndex) => {
      const cleanRow = { ...row };
      delete cleanRow._deleted;
      deleted.push(cleanRow);
    });

    return deleted;
  }

  /**
   * Get all changes summary
   */
  getChanges() {
    return {
      modified: this.getModifiedRecords(),
      added: this.getAddedRecords(),
      deleted: this.getDeletedRecords()
    };
  }

  /**
   * Check if there are any pending changes
   */
  hasChanges() {
    return this._modifiedCells.size > 0 || 
           this._addedRows.size > 0 || 
           this._deletedRows.size > 0;
  }

  /**
   * Clear all changes (after successful save)
   */
  clearChanges() {
    this._modifiedCells.clear();
    this._addedRows.clear();
    this._deletedRows.clear();

    // Clean up row metadata
    this.grid.data.forEach(row => {
      delete row._modified;
      delete row._isNew;
      delete row._deleted;
      delete row._id;
    });
  }

  /**
   * Generate temporary ID for new rows
   */
  generateTempId() {
    return `temp_${Date.now()}_${this._tempIdCounter++}`;
  }

  /**
   * Reset all data and changes
   */
  reset() {
    this._changes = [];
    this._addedRows.clear();
    this._deletedRows.clear();
    this._modifiedCells.clear();
    this._tempIdCounter = 0;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.reset();
    this.grid = null;
  }
}