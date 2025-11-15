
/**
 * GridUndoRedoManager
 * Manages undo/redo stack for grid actions
 */
export class GridUndoRedoManager {
  constructor(grid, storeManager) {
    this.grid = grid;
    this.storeManager = storeManager;
    
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50;
  }

  recordAction(type, data) {
    const action = {
      type, // 'edit', 'add', 'delete'
      data,
      timestamp: Date.now()
    };

    this.undoStack.push(action);
    
    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new action is recorded
    this.redoStack = [];

    this.grid.updateToolbarState();
  }

  undo() {
    if (!this.canUndo()) return false;

    const action = this.undoStack.pop();
    
    switch (action.type) {
      case 'edit':
        this.undoEdit(action.data);
        break;
      case 'add':
        this.undoAdd(action.data);
        break;
      case 'delete':
        this.undoDelete(action.data);
        break;
    }

    this.redoStack.push(action);
    return true;
  }

  redo() {
    if (!this.canRedo()) return false;

    const action = this.redoStack.pop();
    
    switch (action.type) {
      case 'edit':
        this.redoEdit(action.data);
        break;
      case 'add':
        this.redoAdd(action.data);
        break;
      case 'delete':
        this.redoDelete(action.data);
        break;
    }

    this.undoStack.push(action);
    return true;
  }

  undoEdit(data) {
    const { rowIndex, colKey, oldValue } = data;
    this.storeManager.updateCell(rowIndex, colKey, oldValue);
    this.storeManager.undoCellEdit(rowIndex, colKey);
  }

  redoEdit(data) {
    const { rowIndex, colKey, newValue } = data;
    this.storeManager.updateCell(rowIndex, colKey, newValue);
  }

  undoAdd(data) {
    const { rowIndex } = data;
    this.storeManager.undoAddRow(rowIndex);
  }

  redoAdd(data) {
    const { row } = data;
    this.storeManager.addNewRow(row);
  }

  undoDelete(data) {
    const { rowIndex, row } = data;
    this.storeManager.undoDeleteRow(rowIndex, row);
  }

  redoDelete(data) {
    const { rowIndex } = data;
    this.storeManager.deleteRow(rowIndex);
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.grid.updateToolbarState();
  }

  destroy() {
    this.clear();
    this.grid = null;
    this.storeManager = null;
  }
}
