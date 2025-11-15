/**
 * GridSelectionManager
 * Manages row selection with checkboxes
 */
export class GridSelectionManager {
  constructor(grid) {
    this.grid = grid;
  }

  handleSelectAll(isChecked) {
    if (isChecked) {
      this.grid.data.forEach((_, index) => {
        this.grid.selectedRows.add(index);
      });
    } else {
      this.grid.selectedRows.clear();
    }

    this.updateCheckboxes();
    this.grid.lastSelectedIndex = null;
    this.emitSelectionChange();
  }

  handleRowCheckboxChange(rowIndex, isChecked) {
    if (isChecked) {
      this.grid.selectedRows.add(rowIndex);
      this.grid.lastSelectedIndex = rowIndex;
    } else {
      this.grid.selectedRows.delete(rowIndex);
      if (this.grid.lastSelectedIndex === rowIndex) {
        this.grid.lastSelectedIndex = null;
      }
    }

    this.updateSelectAllCheckbox();
    this.emitSelectionChange();
  }

  updateSelectAllCheckbox() {
    const selectAllCheckbox = this.grid.querySelector('.grid-select-all');
    if (!selectAllCheckbox) return;

    if (this.grid.data.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (this.grid.selectedRows.size === this.grid.data.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else if (this.grid.selectedRows.size > 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
  }

  updateCheckboxes() {
    this.grid.querySelectorAll('.grid-row-checkbox').forEach(chk => {
      const rowIndex = parseInt(chk.getAttribute('data-row-index'));
      chk.checked = this.grid.selectedRows.has(rowIndex);
    });

    this.updateSelectAllCheckbox();
  }

  emitSelectionChange() {
    const selectedRecords = this.getSelection();
    
    this.grid.emit('selection-change', {
      selectedRows: Array.from(this.grid.selectedRows),
      selectedRecords: selectedRecords,
      count: this.grid.selectedRows.size
    });

    this.grid.updateToolbarState();
  }

  getSelection() {
    return Array.from(this.grid.selectedRows)
      .map(index => this.grid.data[index])
      .filter(row => row !== undefined);
  }

  selectAll() {
    this.handleSelectAll(true);
    return this;
  }

  deselectAll() {
    this.handleSelectAll(false);
    return this;
  }

  destroy() {
    this.grid = null;
  }
}
