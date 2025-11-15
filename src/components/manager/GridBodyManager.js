/**
 * GridBodyManager
 * Manages DOM rendering for grid body
 */
export class GridBodyManager {
  constructor(grid) {
    this.grid = grid;
  }

  render(dataArray) {
    const tbody = this.grid.querySelector('.grid-body');
    if (!tbody) return;

    if (dataArray.length === 0) {
      tbody.innerHTML = this.buildEmptyRow();
    } else {
      tbody.innerHTML = this.buildDataRows(dataArray);
      this.attachRowEvents();
    }
  }

  buildEmptyRow() {
    const colSpan = this.grid.selectionModel === 'checkbox' 
      ? this.grid.columns.length + 1 
      : this.grid.columns.length;
      
    return `
      <tr class="grid-row-empty">
        <td colspan="${colSpan}" class="grid-cell-empty">
          <div class="grid-empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>No data available</p>
          </div>
        </td>
      </tr>
    `;
  }

  buildDataRows(dataArray) {
    return dataArray
      .filter(row => row._state !== 'destroy') // <-- skip deleted rows
      .map((row, index) => this.buildDataRow(row, index))
      .join('');
}


  // buildDataRows(dataArray) {
  //   return dataArray
  //     .map((row, index) => this.buildDataRow(row, index))
  //     .join('');
  // }

  buildDataRow(rowData, rowIndex) {
    const isModified = rowData._modified || rowData._isNew;
    const isDeleted = rowData._state === 'destroy';
    // const isDeleted = rowData._deleted;
    const rowClasses = ['grid-row'];
    
    if (isModified) rowClasses.push('row-modified');
    if (isDeleted) rowClasses.push('row-deleted');
    if (rowData._isNew) rowClasses.push('row-new');

    let cells = '';
    
    // Checkbox cell
    if (this.grid.selectionModel === 'checkbox') {
      const isChecked = this.grid.selectedRows.has(rowIndex);
      cells += `
        <td class="grid-cell grid-cell-checkbox">
          <input 
            type="checkbox" 
            class="grid-row-checkbox" 
            data-row-index="${rowIndex}"
            ${isChecked ? 'checked' : ''}
            ${isDeleted ? 'disabled' : ''}
          />
        </td>
      `;
    }
    
    // Data cells
    cells += this.grid.columns
      .map(col => this.buildCell(col, rowData, rowIndex))
      .join('');
    
    return `<tr class="${rowClasses.join(' ')}" data-row-index="${rowIndex}">${cells}</tr>`;
  }

  buildCell(col, rowData, rowIndex) {
    // Action buttons
    if (col.actionComponent === 'buttons') {
      return this.buildActionCell(rowIndex);
    }
    
    const value = rowData[col.key];
    const isDeleted = rowData._state === 'destroy';
    const isEditable = col.editor && !col.readOnly && !isDeleted;
    // const isEditable = col.editor && !col.readOnly;
    const cellClasses = ['grid-cell'];
    
    if (isEditable) cellClasses.push('editable');
    if (col.editor) cellClasses.push(`editor-${col.editor}`);
    
    return `
      <td class="${cellClasses.join(' ')}" 
          data-key="${col.key}" 
          data-row-index="${rowIndex}"
          ${isEditable ? 'tabindex="0"' : ''}>
        ${this.formatCellValue(value, col, rowData)}
      </td>
    `;
  }

  buildActionCell(rowIndex) {
    return `
      <td class="grid-cell grid-cell-actions">
        <div class="grid-action-buttons">
          <button class="grid-action-btn btn-view" data-action="view" data-row-index="${rowIndex}">
            <i class="fa-solid fa-eye"></i> View
          </button>
        </div>
      </td>
    `;
  }

  formatCellValue(value, column, rowData = null) {
    if (value === null || value === undefined) {
      return '';
    }

    if (column.editor === 'checkbox') {
      return value ? '✓' : '';
    }

    if (column.editor === 'date' && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        // Ignore
      }
    }

    // ✅ Handle combo editor - try to display the readable value
    if (column.editor === 'combo' && rowData) {
      return this.formatComboValue(value, column, rowData);
    }

    return String(value);
  }

  /**
   * ✅ Format combo cell value - show display field if available
   */
  formatComboValue(value, column, rowData) {
    // Try to get combo configs
    const comboConfigs = column.comboConfigs || {};
    const valueField = comboConfigs.valueField || 'value';
    const displayField = comboConfigs.displayField || 'label';
    
    // Strategy 1: Look for a companion display field in the row data
    // Example: statusId (value field) → statusName (display field)
    const displayFieldKey = this.findDisplayFieldKey(column.key, displayField, rowData);
    if (displayFieldKey && rowData[displayFieldKey]) {
      return String(rowData[displayFieldKey]);
    }
    
    // Strategy 2: Try to find in local options
    const options = column.comboOptions || comboConfigs.options || [];
    if (options.length > 0) {
      const option = options.find(opt => {
        const optValue = typeof opt === 'object' ? opt[valueField] : opt;
        return String(optValue) === String(value);
      });
      
      if (option) {
        const display = typeof option === 'object' ? option[displayField] : option;
        return String(display);
      }
    }
    
    // Strategy 3: Return the raw value
    return value ? String(value) : '';
  }

  /**
   * ✅ Find the display field key in row data
   * Tries common patterns like:
   * - statusId → statusName
   * - assignedTo → assignedToName
   * - categoryId → categoryName
   */
  findDisplayFieldKey(valueKey, displayField, rowData) {
    // Pattern 1: Direct match (if displayField is in rowData)
    if (rowData.hasOwnProperty(displayField)) {
      return displayField;
    }
    
    // Pattern 2: valueKey + 'Name' (e.g., statusId → statusIdName)
    const pattern1 = valueKey + 'Name';
    if (rowData.hasOwnProperty(pattern1)) {
      return pattern1;
    }
    
    // Pattern 3: Remove 'Id' suffix and add 'Name' (e.g., statusId → statusName)
    if (valueKey.endsWith('Id')) {
      const pattern2 = valueKey.slice(0, -2) + 'Name';
      if (rowData.hasOwnProperty(pattern2)) {
        return pattern2;
      }
    }
    
    // Pattern 4: valueKey + displayField (e.g., status + Name → statusName)
    const pattern3 = valueKey + displayField.charAt(0).toUpperCase() + displayField.slice(1);
    if (rowData.hasOwnProperty(pattern3)) {
      return pattern3;
    }
    
    // Pattern 5: Look for any field that contains the valueKey and display pattern
    const keys = Object.keys(rowData);
    const match = keys.find(key => {
      const lowerKey = key.toLowerCase();
      const lowerValueKey = valueKey.toLowerCase();
      const lowerDisplayField = displayField.toLowerCase();
      
      return lowerKey.includes(lowerValueKey) && 
             lowerKey.includes(lowerDisplayField);
    });
    
    if (match) {
      return match;
    }
    
    return null;
  }

  attachRowEvents() {
    // Double-click to edit
    this.grid.querySelectorAll('.grid-cell.editable').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const rowIndex = parseInt(cell.dataset.rowIndex);
        const colKey = cell.dataset.key;
        this.grid.editorManager.startEdit(rowIndex, colKey);
      });

      // Enter key to edit
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !this.grid.editorManager.isEditing) {
          const rowIndex = parseInt(cell.dataset.rowIndex);
          const colKey = cell.dataset.key;
          this.grid.editorManager.startEdit(rowIndex, colKey);
        }
      });
    });

    // Checkbox events
    if (this.grid.selectionModel === 'checkbox') {
      const selectAllCheckbox = this.grid.querySelector('.grid-select-all');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
          this.grid.selectionManager.handleSelectAll(e.target.checked);
        });
      }

      this.grid.querySelectorAll('.grid-row-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const rowIndex = parseInt(e.target.dataset.rowIndex);
          this.grid.selectionManager.handleRowCheckboxChange(rowIndex, e.target.checked);
        });
      });
    }
  }

  destroy() {
    this.grid = null;
  }
}