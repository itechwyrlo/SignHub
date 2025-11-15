/**
 * GridEditorManager
 * Manages inline editing for grid cells
 * Supports multiple editor types: text, number, combo, date, checkbox
 */
export class GridEditorManager {
  constructor(grid, storeManager) {
    this.grid = grid;
    this.storeManager = storeManager;
    
    this.activeEditor = null;
    this.editingCell = null;
    this.editingRowIndex = null;
    this.editingColKey = null;
    this.originalValue = null;
    this.isEditing = false;
  }

  /**
   * Start editing a cell
   */
  startEdit(rowIndex, colKey) {
   

    // Check if already editing
    if (this.isEditing) {
      this.commitEdit();
    }

    const column = this.grid.columns.find(col => col.key === colKey);
    if (!column || column.readOnly || !column.editor || column.actionComponent) {
      return false;
    }

    const row = this.grid.data[rowIndex];
    if (row._deleted) return;

    if (!row) return false;

    // Fire beforeedit event
    const beforeEditEvent = this.grid.fireEvent('beforeedit', {
      rowIndex,
      colKey,
      value: row[colKey],
      row
    });

    if (beforeEditEvent.defaultPrevented) {
      return false;
    }

    // Find the cell element
    const cell = this.grid.querySelector(
      `.grid-row[data-row-index="${rowIndex}"] .grid-cell[data-key="${colKey}"]`
    );

    if (!cell) return false;

    this.editingCell = cell;
    this.editingRowIndex = rowIndex;
    this.editingColKey = colKey;
    this.originalValue = row[colKey];
    this.isEditing = true;

    // Create editor based on type
    this.createEditor(column, row[colKey], cell);

    return true;
  }

  /**
   * Create appropriate editor for column type
   */
  createEditor(column, value, cell) {
    cell.classList.add('editing');
    
    const editorType = column.editor;
    
    switch (editorType) {
      case 'text':
        this.activeEditor = this.createTextEditor(value, cell);
        break;
      case 'number':
        this.activeEditor = this.createNumberEditor(value, cell);
        break;
      case 'combo':
        this.activeEditor = this.createComboEditor(value, cell, column);
        break;
      case 'date':
        this.activeEditor = this.createDateEditor(value, cell);
        break;
      case 'checkbox':
        this.activeEditor = this.createCheckboxEditor(value, cell);
        break;
      default:
        this.activeEditor = this.createTextEditor(value, cell);
    }

    this.attachEditorEvents();
  }

  /**
   * Create text input editor
   */
  createTextEditor(value, cell) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'editor-input editor-text';
    input.value = value || '';
    
    cell.innerHTML = '';
    cell.appendChild(input);
    
    input.focus();
    input.select();
    
    return input;
  }

  /**
   * Create number input editor
   */
  createNumberEditor(value, cell) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'editor-input editor-number';
    input.value = value || '';
    
    cell.innerHTML = '';
    cell.appendChild(input);
    
    input.focus();
    input.select();
    
    return input;
  }

  /**
   * Create combo/select editor using x-combo component
   */
  createComboEditor(value, cell, column) {
    const rowIndex = this.editingRowIndex;
    const colKey = this.editingColKey;
    
    // Parse combo configs
    const comboConfigs = column.comboConfigs || {};
    const dataSource = comboConfigs.dataSource || null;
    const queryMode = comboConfigs.queryMode || 'local';
    const valueField = comboConfigs.valueField || 'value';
    const displayField = comboConfigs.displayField || 'label';
    const options = column.comboOptions || comboConfigs.options || [];
    
    // Generate unique combo ID by replacing last part of grid ID
    const gridId = this.grid.gridId || this.grid.getAttribute('data-id');
    const gridIdParts = gridId.split('-');
    gridIdParts[gridIdParts.length - 1] = 'combo';
    const comboId = gridIdParts.join('-');
    
    // Create x-combo element
    const combo = document.createElement('x-combo');
    combo.setAttribute('data-id', comboId);
    combo.setAttribute('data-value', value || '');
    combo.setAttribute('data-query-mode', queryMode);
    combo.setAttribute('data-value-field', valueField);
    combo.setAttribute('data-display-field', displayField);
    combo.setAttribute('data-placeholder', 'Select...');
    
    if (dataSource) {
      combo.setAttribute('data-source', dataSource);
    }
    
    // For local mode, set options as attribute
    if (queryMode === 'local' && options.length > 0) {
      combo.setAttribute('data-options', JSON.stringify(options));
    }
    
    // Store original value
    combo.dataset.originalValue = String(value || '');
    combo.dataset.userInteracted = 'false';
    
    cell.innerHTML = '';
    cell.appendChild(combo);
    
    // Wait for combo to initialize, then set value
    setTimeout(() => {
      // Find display value from options if available
      let displayValue = value;
      
      if (options.length > 0) {
        const option = options.find(opt => {
          const optValue = typeof opt === 'object' ? opt[valueField] : opt;
          return String(optValue) === String(value);
        });
        
        if (option) {
          displayValue = typeof option === 'object' ? option[displayField] : option;
        }
      }
      
      combo.setValue(value, displayValue);
      
      // Handle selection change
      combo.addEventListener('change', (e) => {
        combo.dataset.userInteracted = 'true';
        console.log('✏️ Combo changed:', e.detail);
      });
      
      // Handle select (when option is picked)
      combo.addEventListener('select', (e) => {
        combo.dataset.userInteracted = 'true';
        console.log('👆 Combo selected:', e.detail);
        
        // Auto-commit after selection
        setTimeout(() => {
          if (this.isEditing && this.activeEditor === combo) {
            this.commitEdit();
          }
        }, 100);
      });
      
      // Custom handler if provided
      if (comboConfigs.handler && typeof comboConfigs.handler === 'function') {
        combo.addEventListener('select', (e) => {
          const row = this.grid.data[rowIndex];
          comboConfigs.handler(combo, e.detail.option, row);
        });
      }
      
      // Open dropdown automatically
      combo.openDropdown();
    }, 50);
    
    return combo;
  }
  /**
   * Create date input editor
   */
  /**
 * Create date input editor
 */
createDateEditor(value, cell) {
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'editor-input editor-date';
  
  // ✅ Store original value for comparison
  let formattedValue = '';
  
  // Convert value to YYYY-MM-DD format if needed
  if (value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        formattedValue = `${year}-${month}-${day}`;
        input.value = formattedValue;
      }
    } catch (e) {
      console.warn('Invalid date value:', value);
    }
  }
  
  // ✅ Store the original formatted value as a data attribute
  input.dataset.originalValue = formattedValue;
  
  cell.innerHTML = '';
  cell.appendChild(input);
  
  // ✅ FIX: Focus and trigger the date picker with delay
  setTimeout(() => {
    input.focus();
    
    // Try to open the date picker programmatically
    try {
      input.showPicker();  // ⭐ This opens the calendar automatically
    } catch (e) {
      // showPicker() not supported in all browsers, user can click
      console.log('Date picker auto-open not supported');
    }
  }, 50);
  
  return input;
}

  /**
   * Create checkbox editor
   */
  createCheckboxEditor(value, cell) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'editor-input editor-checkbox';
    checkbox.checked = !!value;
    
    cell.innerHTML = '';
    cell.appendChild(checkbox);
    
    checkbox.focus();
    
    // Auto-commit on checkbox change
    checkbox.addEventListener('change', () => {
      this.commitEdit();
    });
    
    return checkbox;
  }

  /**
   * Attach events to active editor
   */
  /**
 * Attach events to active editor
 */
attachEditorEvents() {
  if (!this.activeEditor) return;

  // ✅ x-combo component handles its own events
  if (this.activeEditor.tagName === 'X-COMBO') {
    // Combo component handles dropdown, selection, etc.
    // We just need to handle keyboard shortcuts
    
    this.activeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const moveForward = !e.shiftKey;
        this.commitEdit();
        this.moveToNextEditableCell(moveForward);
      }
    });
    
    return;
  }

  // Original event handling for other input types
  this.activeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const moveForward = !e.shiftKey;
      this.commitEdit();
      this.moveToNextEditableCell(moveForward);
    }
  });

  this.activeEditor.addEventListener('blur', (e) => {
    setTimeout(() => {
      if (this.isEditing && this.activeEditor === e.target) {
        this.commitEdit();
      }
    }, 100);
  });
}

/**
 * Commit edit and save changes
 */
commitEdit() {
  if (!this.isEditing || !this.activeEditor) return false;

  const newValue = this.getEditorValue();
  
  // ✅ Validate value with detailed error message
  const validationResult = this.validateValueWithMessage(newValue);
  if (!validationResult.isValid) {
    this.showValidationError(validationResult.message);
    return false;
  }

  const row = this.grid.data[this.editingRowIndex];
  const oldValue = row[this.editingColKey];

  // ✅ Debug logging for combo
  if (this.activeEditor.tagName === 'SELECT') {
    console.log('💾 Committing combo edit:', {
      oldValue,
      newValue,
      userInteracted: this.activeEditor.dataset.userInteracted,
      hasChanged: this.hasValueChanged(oldValue, newValue)
    });
  }

  // Only update if value actually changed (with proper comparison)
  const hasChanged = this.hasValueChanged(oldValue, newValue);
  
  console.log('📝 Edit comparison:', {
    column: this.editingColKey,
    oldValue,
    newValue,
    hasChanged
  });
  
  if (hasChanged) {
    // Fire beforecommit event
    const beforeCommitEvent = this.grid.fireEvent('beforecommit', {
      rowIndex: this.editingRowIndex,
      colKey: this.editingColKey,
      oldValue,
      newValue,
      row
    });

    if (beforeCommitEvent.defaultPrevented) {
      this.cancelEdit();
      return false;
    }

    // Update data
    this.storeManager.updateCell(this.editingRowIndex, this.editingColKey, newValue);
    
    // Record undo action
    this.grid.undoRedoManager.recordAction('edit', {
      rowIndex: this.editingRowIndex,
      colKey: this.editingColKey,
      oldValue,
      newValue
    });

    // Fire afteredit event
    this.grid.fireEvent('afteredit', {
      rowIndex: this.editingRowIndex,
      colKey: this.editingColKey,
      oldValue,
      newValue,
      row
    });
  } else {
    console.log('⏭️ No changes detected, skipping update');
  }

  this.exitEditMode();
  this.grid.updateToolbarState();

  return true;
}

  /**
   * ✅ Validate value and return detailed error message
   */
  validateValueWithMessage(value) {
    const column = this.grid.columns.find(col => col.key === this.editingColKey);
    
    if (!column) return { isValid: true };

    // Check required constraint
    if (column.required) {
      const normalizedValue = this.normalizeValue(value);
      if (normalizedValue === '') {
        return { 
          isValid: false, 
          message: `${column.label} is required` 
        };
      }
    }

    // Type-specific validation
    switch (column.editor) {
      case 'number':
        if (value !== '' && value !== null) {
          if (isNaN(value)) {
            return { 
              isValid: false, 
              message: 'Please enter a valid number' 
            };
          }
          
          const numValue = parseFloat(value);
          
          if (column.min !== null && numValue < column.min) {
            return { 
              isValid: false, 
              message: `Value must be at least ${column.min}` 
            };
          }
          
          if (column.max !== null && numValue > column.max) {
            return { 
              isValid: false, 
              message: `Value must not exceed ${column.max}` 
            };
          }
        }
        break;

      case 'date':
        if (value !== '' && value !== null) {
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              return { 
                isValid: false, 
                message: 'Please enter a valid date' 
              };
            }
            
            if (column.min) {
              const minDate = new Date(column.min);
              if (date < minDate) {
                return { 
                  isValid: false, 
                  message: `Date must be after ${column.min}` 
                };
              }
            }
            
            if (column.max) {
              const maxDate = new Date(column.max);
              if (date > maxDate) {
                return { 
                  isValid: false, 
                  message: `Date must be before ${column.max}` 
                };
              }
            }
          } catch (e) {
            return { 
              isValid: false, 
              message: 'Invalid date format' 
            };
          }
        }
        break;

      case 'combo':
        if (column.comboOptions && Array.isArray(column.comboOptions) && value !== '') {
          const validValues = column.comboOptions.map(opt => 
            typeof opt === 'object' ? opt.value : opt
          );
          
          if (!validValues.includes(value)) {
            return { 
              isValid: false, 
              message: 'Please select a valid option' 
            };
          }
        }
        break;

      case 'text':
        if (value !== '' && value !== null) {
          const strValue = String(value);
          
          if (column.minLength && strValue.length < column.minLength) {
            return { 
              isValid: false, 
              message: `Minimum length is ${column.minLength} characters` 
            };
          }
          
          if (column.maxLength && strValue.length > column.maxLength) {
            return { 
              isValid: false, 
              message: `Maximum length is ${column.maxLength} characters` 
            };
          }
          
          if (column.pattern) {
            const regex = new RegExp(column.pattern);
            if (!regex.test(strValue)) {
              return { 
                isValid: false, 
                message: 'Invalid format' 
              };
            }
          }
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          return { 
            isValid: false, 
            message: 'Invalid checkbox value' 
          };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * ✅ Check if value actually changed (handles different formats)
   */
  hasValueChanged(oldValue, newValue) {
    const column = this.grid.columns.find(col => col.key === this.editingColKey);
    
    // Special handling for different editor types
    if (column) {
      switch (column.editor) {
        case 'date':
          return this.hasDateChanged(oldValue, newValue);
        case 'number':
          return this.hasNumberChanged(oldValue, newValue);
        default:
          // For text, combo, checkbox - use standard comparison
          return this.normalizeValue(oldValue) !== this.normalizeValue(newValue);
      }
    }
    
    // Fallback to standard comparison
    return this.normalizeValue(oldValue) !== this.normalizeValue(newValue);
  }

  /**
   * ✅ Compare dates (handles different date formats)
   */
  hasDateChanged(oldValue, newValue) {
    // Normalize both to YYYY-MM-DD format
    const normalizedOld = this.normalizeDateValue(oldValue);
    const normalizedNew = this.normalizeDateValue(newValue);
    
    return normalizedOld !== normalizedNew;
  }

  /**
   * ✅ Normalize date to YYYY-MM-DD format
   */
  normalizeDateValue(value) {
    if (!value || value === '') return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }

  /**
   * ✅ Compare numbers (handles string vs number)
   */
  hasNumberChanged(oldValue, newValue) {
    // Normalize both to numbers
    const normalizedOld = this.normalizeNumberValue(oldValue);
    const normalizedNew = this.normalizeNumberValue(newValue);
    
    return normalizedOld !== normalizedNew;
  }

  /**
   * ✅ Normalize number value
   */
  normalizeNumberValue(value) {
    if (value === null || value === undefined || value === '') return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    return String(num);
  }

  /**
   * ✅ Normalize value for comparison (treat null, undefined, '' as same)
   */
  normalizeValue(value) {
    // Treat null, undefined, and empty string as equivalent
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // Convert to string for comparison
    return String(value);
  }

  /**
   * Cancel edit and restore original value
   */
  cancelEdit() {
    if (!this.isEditing) return;

    this.exitEditMode();
  }

  /**
   * Exit edit mode and restore cell display
   */
  // Updated GridEditorManager - createComboEditor method

/**
 * Create combo/select editor using x-combo component
 */
createComboEditor(value, cell, column) {
  const rowIndex = this.editingRowIndex;
  const colKey = this.editingColKey;
  
  // Parse combo configs
  const comboConfigs = column.comboConfigs || {};
  const dataSource = comboConfigs.dataSource || null;
  const queryMode = comboConfigs.queryMode || 'local';
  const valueField = comboConfigs.valueField || 'value';
  const displayField = comboConfigs.displayField || 'label';
  const options = column.comboOptions || comboConfigs.options || [];
  
  // Generate unique combo ID
  const gridId = this.grid.gridId || this.grid.getAttribute('data-id');
  const comboId = `${gridId}-combo-${rowIndex}-${colKey}`;
  
  // Create x-combo element
  const combo = document.createElement('x-combo');
  combo.setAttribute('data-id', comboId);
  combo.setAttribute('data-value', value || '');
  combo.setAttribute('data-query-mode', queryMode);
  combo.setAttribute('data-value-field', valueField);
  combo.setAttribute('data-display-field', displayField);
  combo.setAttribute('data-placeholder', 'Select...');
  
  if (dataSource) {
    combo.setAttribute('data-source', dataSource);
  }
  
  // For local mode, set options as attribute
  if (queryMode === 'local' && options.length > 0) {
    combo.setAttribute('data-options', JSON.stringify(options));
  }
  
  // Store original value
  combo.dataset.originalValue = String(value || '');
  combo.dataset.userInteracted = 'false';
  
  cell.innerHTML = '';
  cell.appendChild(combo);
  
  // Wait for combo to initialize, then set value
  setTimeout(() => {
    // Find display value from options if available
    let displayValue = value;
    
    if (options.length > 0) {
      const option = options.find(opt => {
        const optValue = typeof opt === 'object' ? opt[valueField] : opt;
        return String(optValue) === String(value);
      });
      
      if (option) {
        displayValue = typeof option === 'object' ? option[displayField] : option;
      }
    }
    
    combo.setValue(value, displayValue);
    
    // Handle selection change
    combo.addEventListener('change', (e) => {
      combo.dataset.userInteracted = 'true';
      console.log('✏️ Combo changed:', e.detail);
    });
    
    // Handle select (when option is picked)
    combo.addEventListener('select', (e) => {
      combo.dataset.userInteracted = 'true';
      console.log('👆 Combo selected:', e.detail);
      
      // Auto-commit after selection
      setTimeout(() => {
        if (this.isEditing && this.activeEditor === combo) {
          this.commitEdit();
        }
      }, 100);
    });
    
    // Custom handler if provided
    if (comboConfigs.handler && typeof comboConfigs.handler === 'function') {
      combo.addEventListener('select', (e) => {
        const row = this.grid.data[rowIndex];
        comboConfigs.handler(combo, e.detail.option, row);
      });
    }
    
    // Open dropdown automatically
    combo.openDropdown();
  }, 50);
  
  return combo;
}

/**
 * Get value from active editor
 */
getEditorValue() {
    if (!this.activeEditor) return null;
  
    if (this.activeEditor.type === 'checkbox') {
      return this.activeEditor.checked;
    }
  
    // ✅ Handle x-combo component
    if (this.activeEditor.tagName === 'X-COMBO') {
      const combo = this.activeEditor;
      const userInteracted = combo.dataset.userInteracted === 'true';
      const originalValue = combo.dataset.originalValue || '';
      
      console.log('🔍 Getting combo value:', {
        currentValue: combo.getValue(),
        userInteracted,
        originalValue,
        hasChanged: combo.hasChanged()
      });
      
      // If user didn't interact, return original value
      if (!userInteracted || !combo.hasChanged()) {
        return originalValue;
      }
      
      // User made a selection - return new value
      return combo.getValue();
    }
  
    return this.activeEditor.value;
  }
/**
 * Attach events to active editor
 */
attachEditorEvents() {
    if (!this.activeEditor) return;
  
    // ✅ x-combo component handles its own events
    if (this.activeEditor.tagName === 'X-COMBO') {
      // Combo component handles dropdown, selection, etc.
      // We just need to handle keyboard shortcuts
      
      this.activeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.cancelEdit();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const moveForward = !e.shiftKey;
          this.commitEdit();
          this.moveToNextEditableCell(moveForward);
        }
      });
      
      return;
    }
  
    // Original event handling for other input types
    this.activeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const moveForward = !e.shiftKey;
        this.commitEdit();
        this.moveToNextEditableCell(moveForward);
      }
    });
  
    this.activeEditor.addEventListener('blur', (e) => {
      setTimeout(() => {
        if (this.isEditing && this.activeEditor === e.target) {
          this.commitEdit();
        }
      }, 100);
    });
  }

/**
 * Exit edit mode and restore cell display
 */
exitEditMode() {
    if (this.editingCell) {
      this.editingCell.classList.remove('editing');
      
      // Restore cell content using the body manager's formatting
      const row = this.grid.data[this.editingRowIndex];
      const column = this.grid.columns.find(col => col.key === this.editingColKey);
      const value = row[this.editingColKey];
      
      // Use body manager's formatCellValue which handles combo display properly
      this.editingCell.textContent = this.grid.bodyManager.formatCellValue(value, column, row);
    }
  
    this.activeEditor = null;
    this.editingCell = null;
    this.editingRowIndex = null;
    this.editingColKey = null;
    this.originalValue = null;
    this.isEditing = false;
  }

  /**
   * Get value from active editor
   */
  getEditorValue() {
    if (!this.activeEditor) return null;
  
    if (this.activeEditor.type === 'checkbox') {
      return this.activeEditor.checked;
    }
  
    // ✅ Handle x-combo component
    if (this.activeEditor.tagName === 'X-COMBO') {
      const combo = this.activeEditor;
      const userInteracted = combo.dataset.userInteracted === 'true';
      const originalValue = combo.dataset.originalValue || '';
      
      console.log('🔍 Getting combo value:', {
        currentValue: combo.getValue(),
        userInteracted,
        originalValue,
        hasChanged: combo.hasChanged()
      });
      
      // If user didn't interact, return original value
      if (!userInteracted || !combo.hasChanged()) {
        return originalValue;
      }
      
      // User made a selection - return new value
      return combo.getValue();
    }
  
    return this.activeEditor.value;
  }

  /**
   * Validate editor value based on editor type and column constraints
   */
  validateValue(value) {
    const column = this.grid.columns.find(col => col.key === this.editingColKey);
    
    if (!column) return true;

    // ✅ Check required constraint
    if (column.required) {
      const normalizedValue = this.normalizeValue(value);
      if (normalizedValue === '') {
        console.warn('Field is required:', column.label);
        return false;
      }
    }

    // ✅ Type-specific validation
    switch (column.editor) {
      case 'number':
        if (value !== '' && value !== null) {
          // Check if valid number
          if (isNaN(value)) {
            console.warn('Invalid number value:', value);
            return false;
          }
          
          const numValue = parseFloat(value);
          
          // Check min constraint
          if (column.min !== null && numValue < column.min) {
            console.warn(`Value ${numValue} is below minimum ${column.min}`);
            return false;
          }
          
          // Check max constraint
          if (column.max !== null && numValue > column.max) {
            console.warn(`Value ${numValue} exceeds maximum ${column.max}`);
            return false;
          }
        }
        break;

      case 'date':
        if (value !== '' && value !== null) {
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              console.warn('Invalid date value:', value);
              return false;
            }
            
            // Check min date constraint
            if (column.min) {
              const minDate = new Date(column.min);
              if (date < minDate) {
                console.warn(`Date ${value} is before minimum ${column.min}`);
                return false;
              }
            }
            
            // Check max date constraint
            if (column.max) {
              const maxDate = new Date(column.max);
              if (date > maxDate) {
                console.warn(`Date ${value} is after maximum ${column.max}`);
                return false;
              }
            }
          } catch (e) {
            console.warn('Date validation error:', e);
            return false;
          }
        }
        break;

      case 'combo':
        // Validate against combo options if provided
        if (column.comboOptions && Array.isArray(column.comboOptions) && value !== '') {
          const validValues = column.comboOptions.map(opt => 
            typeof opt === 'object' ? opt.value : opt
          );
          
          if (!validValues.includes(value)) {
            console.warn('Invalid combo value:', value, 'Valid options:', validValues);
            return false;
          }
        }
        break;

      case 'text':
        if (value !== '' && value !== null) {
          const strValue = String(value);
          
          // Check min length
          if (column.minLength && strValue.length < column.minLength) {
            console.warn(`Text length ${strValue.length} is below minimum ${column.minLength}`);
            return false;
          }
          
          // Check max length
          if (column.maxLength && strValue.length > column.maxLength) {
            console.warn(`Text length ${strValue.length} exceeds maximum ${column.maxLength}`);
            return false;
          }
          
          // Check pattern (regex)
          if (column.pattern) {
            const regex = new RegExp(column.pattern);
            if (!regex.test(strValue)) {
              console.warn(`Text "${strValue}" does not match pattern ${column.pattern}`);
              return false;
            }
          }
        }
        break;

      case 'checkbox':
        // Checkbox should be boolean
        if (typeof value !== 'boolean') {
          console.warn('Checkbox value must be boolean:', value);
          return false;
        }
        break;

      default:
        // Unknown editor type, allow by default
        break;
    }

    return true;
  }

  /**
   * Show validation error with message
   */
  showValidationError(message) {
    if (this.activeEditor) {
      this.activeEditor.classList.add('invalid');
      
      // ✅ Show error message as tooltip/title
      if (message) {
        this.activeEditor.title = message;
        
        // ✅ Create error message element
        const errorMsg = document.createElement('div');
        errorMsg.className = 'editor-validation-error';
        errorMsg.textContent = message;
        
        const cell = this.editingCell;
        if (cell) {
          // Remove existing error messages
          const existingError = cell.querySelector('.editor-validation-error');
          if (existingError) existingError.remove();
          
          cell.appendChild(errorMsg);
        }
      }
      
      setTimeout(() => {
        if (this.activeEditor) {
          this.activeEditor.classList.remove('invalid');
          this.activeEditor.title = '';
        }
        
        // Remove error message
        const cell = this.editingCell;
        if (cell) {
          const errorMsg = cell.querySelector('.editor-validation-error');
          if (errorMsg) errorMsg.remove();
        }
      }, 3000);
    }
  }

  /**
   * Format cell value for display
   */
  formatCellValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? '✓' : '';
    }

    return String(value);
  }

  /**
   * Move to next/previous editable cell
   */
  moveToNextEditableCell(forward = true) {
    const editableColumns = this.grid.columns.filter(col => 
      col.editor && !col.readOnly && !col.actionComponent
    );

    if (editableColumns.length === 0) return;

    const currentColIndex = editableColumns.findIndex(col => col.key === this.editingColKey);
    let nextColIndex = forward ? currentColIndex + 1 : currentColIndex - 1;
    let nextRowIndex = this.editingRowIndex;

    // Wrap to next/previous row
    if (nextColIndex >= editableColumns.length) {
      nextColIndex = 0;
      nextRowIndex++;
    } else if (nextColIndex < 0) {
      nextColIndex = editableColumns.length - 1;
      nextRowIndex--;
    }

    // Check bounds
    if (nextRowIndex < 0 || nextRowIndex >= this.grid.data.length) {
      return;
    }

    const nextCol = editableColumns[nextColIndex];
    setTimeout(() => {
      this.startEdit(nextRowIndex, nextCol.key);
    }, 50);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.isEditing) {
      this.cancelEdit();
    }
    this.grid = null;
    this.storeManager = null;
  }
}