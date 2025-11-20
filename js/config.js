/**
 * 酒馆日记本 - 配置管理模块
 * 负责配置管理页面的功能实现，包括域控、品牌、车型、基线和业务模块的管理
 */

// 全局变量
let config = {
  domains: [],
  brands: [],
  models: [],
  baselines: [],
  businessModules: []
};

let currentConfigType = '';
let currentConfigItem = null;

// 配置类型定义
const configTypes = {
  domains: {
    title: '域控配置',
    fields: [
      { name: 'name', label: '名称', required: true, type: 'text' },
      { name: 'description', label: '描述', required: false, type: 'textarea' }
    ],
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '名称' },
      { key: 'description', label: '描述' },
      { key: 'actions', label: '操作' }
    ]
  },
  brands: {
    title: '品牌配置',
    fields: [
      { name: 'name', label: '名称', required: true, type: 'text' },
      { name: 'domainIds', label: '所属域控', required: true, type: 'multiselect', options: [] },
      { name: 'description', label: '描述', required: false, type: 'textarea' }
    ],
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '名称' },
      { key: 'domainNames', label: '所属域控' },
      { key: 'description', label: '描述' },
      { key: 'actions', label: '操作' }
    ]
  },
  models: {
    title: '车型配置',
    fields: [
      { name: 'name', label: '名称', required: true, type: 'text' },
      { name: 'brandId', label: '所属品牌', required: true, type: 'select', options: [] },
      { name: 'baselineIds', label: '关联基线', required: false, type: 'multiselect', options: [] },
      { name: 'description', label: '描述', required: false, type: 'textarea' }
    ],
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '名称' },
      { key: 'brandName', label: '所属品牌' },
      { key: 'baselineNames', label: '关联基线' },
      { key: 'description', label: '描述' },
      { key: 'actions', label: '操作' }
    ]
  },
  baselines: {
    title: '基线配置',
    fields: [
      { name: 'name', label: '名称', required: true, type: 'text' },
      { name: 'modelIds', label: '关联车型', required: true, type: 'multiselect', options: [] },
      { name: 'description', label: '描述', required: false, type: 'textarea' }
    ],
    tableColumns: [
      { key: 'id', label: 'ID' },
      { name: 'name', label: '名称' },
      { key: 'modelNames', label: '关联车型' },
      { key: 'description', label: '描述' },
      { key: 'actions', label: '操作' }
    ]
  },
  businessModules: {
    title: '业务模块配置',
    fields: [
      { name: 'name', label: '名称', required: true, type: 'text' },
      { name: 'domainIds', label: '适用域控', required: true, type: 'multiselect', options: [] },
      { name: 'description', label: '描述', required: false, type: 'textarea' }
    ],
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '名称' },
      { key: 'domainNames', label: '适用域控' },
      { key: 'description', label: '描述' },
      { key: 'actions', label: '操作' }
    ]
  }
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否已登录且具有管理员权限
  if (!checkPermission('admin')) {
    return;
  }
  
  // 初始化页面
  initConfigPage();
});

// 初始化配置管理页面
function initConfigPage() {
  // 显示用户信息
  displayUserInfo();
  
  // 加载配置数据
  loadConfigData();
  
  // 解析URL参数，确定当前配置类型
  const urlParams = new URLSearchParams(window.location.search);
  currentConfigType = urlParams.get('type') || 'domains';
  
  // 如果配置类型不存在，默认为域控配置
  if (!configTypes[currentConfigType]) {
    currentConfigType = 'domains';
  }
  
  // 设置页面标题
  document.getElementById('configTitle').textContent = configTypes[currentConfigType].title;
  
  // 激活对应的选项卡
document.querySelectorAll('.config-tab').forEach(tab => {
  if (tab.dataset.type === currentConfigType) {
    tab.classList.add('active');
  } else {
    tab.classList.remove('active');
  }
});

// 确保下拉菜单默认隐藏
const dropdownMenu = document.querySelector('.dropdown-menu');
if (dropdownMenu) {
  dropdownMenu.classList.remove('show');
}

// 渲染配置表格
renderConfigTable();
  
  // 设置事件监听
  setupEventListeners();
}

// 显示用户信息
function displayUserInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = `欢迎，${user.name}`;
  }
}

// 加载配置数据
async function loadConfigData() {
  try {
    const configData = JSON.parse(localStorage.getItem('config')) || {};
    
    // 设置默认配置结构，确保包含所有配置类型
    config.domains = configData.domains || [];
    config.brands = configData.brands || [];
    config.models = configData.models || [];
    config.baselines = configData.baselines || [];
    config.businessModules = configData.businessModules || [];
    // 加载top-level的updatedAt字段
    config.updatedAt = configData.updatedAt || new Date().toISOString();
    
    // 保存完整的配置到localStorage
    saveConfigData();
  } catch (error) {
    console.error('加载配置数据失败:', error);
  }
}

// 渲染配置表格
function renderConfigTable() {
  const tableBody = document.getElementById('configTableBody');
  const tableHeader = document.getElementById('configTableHeader');
  
  // 清空表格
  tableBody.innerHTML = '';
  
  // 渲染表头
  let headerHtml = '';
  configTypes[currentConfigType].tableColumns.forEach(column => {
    headerHtml += `<th>${column.label}</th>`;
  });
  tableHeader.innerHTML = `<tr>${headerHtml}</tr>`;
  
  // 获取当前配置类型的数据
  const configData = config[currentConfigType];
  
  // 如果没有数据，显示提示
  if (configData.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${configTypes[currentConfigType].tableColumns.length}" class="text-center">暂无数据</td>`;
    tableBody.appendChild(row);
    return;
  }
  
  // 渲染表格数据
  configData.forEach(item => {
    const row = document.createElement('tr');
    let rowHtml = '';
    
    configTypes[currentConfigType].tableColumns.forEach(column => {
      if (column.key === 'actions') {
        // 操作列
        rowHtml += `
          <td>
            <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">删除</button>
          </td>
        `;
      } else if (column.key === 'domainName') {
        // 域控名称列
        const domain = config.domains.find(d => d.id === item.domainId);
        rowHtml += `<td>${domain ? domain.name : '未知'}</td>`;
      } else if (column.key === 'brandName') {
        // 品牌名称列
        const brand = config.brands.find(b => b.id === item.brandId);
        rowHtml += `<td>${brand ? brand.name : '未知'}</td>`;
      } else if (column.key === 'modelName') {
        // 车型名称列
        const model = config.models.find(m => m.id === item.modelId);
        rowHtml += `<td>${model ? model.name : '未知'}</td>`;
      } else if (column.key === 'modelNames') {
        // 关联车型列（多个）
        if (item.modelIds && item.modelIds.length > 0) {
          const modelNames = item.modelIds.map(modelId => {
            const model = config.models.find(m => m.id === modelId);
            return model ? model.name : '未知';
          }).join(', ');
          rowHtml += `<td>${modelNames}</td>`;
        } else {
          rowHtml += '<td>-</td>';
        }
      } else if (column.key === 'baselineNames') {
        // 关联基线列（多个）
        if (item.baselineIds && item.baselineIds.length > 0) {
          const baselineNames = item.baselineIds.map(baselineId => {
            const baseline = config.baselines.find(b => b.id === baselineId);
            return baseline ? baseline.name : '未知';
          }).join(', ');
          rowHtml += `<td>${baselineNames}</td>`;
        } else {
          rowHtml += '<td>-</td>';
        }
      } else if (column.key === 'domainNames') {
        // 适用域控列（多个）
        if (item.domainIds && item.domainIds.length > 0) {
          const domainNames = item.domainIds.map(domainId => {
            const domain = config.domains.find(d => d.id === domainId);
            return domain ? domain.name : '未知';
          }).join(', ');
          rowHtml += `<td>${domainNames}</td>`;
        } else {
          rowHtml += '<td>-</td>';
        }
      } else {
        // 普通列
        rowHtml += `<td>${item[column.key] || '-'}</td>`;
      }
    });
    
    row.innerHTML = rowHtml;
    tableBody.appendChild(row);
  });
  
  // 设置编辑和删除按钮事件
  setupTableButtonEvents();
}

// 设置表格按钮事件
function setupTableButtonEvents() {
  // 编辑按钮事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      editConfigItem(id);
    });
  });
  
  // 删除按钮事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      deleteConfigItem(id);
    });
  });
}

// 设置事件监听
function setupEventListeners() {
  // 新增按钮事件
  document.getElementById('addNewBtn').addEventListener('click', function() {
    addNewConfigItem();
  });
  
  // 关闭模态框按钮事件
  document.getElementById('closeModalBtn').addEventListener('click', function() {
    closeModal();
  });
  
  // 取消按钮事件
  document.getElementById('cancelBtn').addEventListener('click', function() {
    closeModal();
  });
  
  // 保存按钮事件
  document.getElementById('saveBtn').addEventListener('click', function() {
    saveConfigItem();
  });
  
  // 关闭删除模态框按钮事件
  document.getElementById('closeDeleteModalBtn').addEventListener('click', function() {
    closeDeleteModal();
  });
  
  // 取消删除按钮事件
  document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    closeDeleteModal();
  });
  
  // 确认删除按钮事件
  document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    confirmDeleteConfigItem();
  });
  
  // 退出登录按钮事件
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 设置下拉菜单事件
  setupDropdownMenus();
  
  // 点击模态框外部关闭模态框
  window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('configModal')) {
      closeModal();
    }
    if (e.target === document.getElementById('deleteModal')) {
      closeDeleteModal();
    }
  });
}

// 设置下拉菜单事件
function setupDropdownMenus() {
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 切换下拉菜单显示/隐藏
      const dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle('show');
      
      // 关闭其他下拉菜单
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.classList.remove('show');
        }
      });
    });
  });
  
  // 点击页面其他地方关闭下拉菜单
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-item')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
}

// 新增配置项
function addNewConfigItem() {
  // 重置当前配置项
  currentConfigItem = null;
  
  // 设置模态框标题
  document.getElementById('modalTitle').textContent = `新增${configTypes[currentConfigType].title.split('配置')[0]}`;
  
  // 清空表单
  document.getElementById('configForm').reset();
  document.getElementById('configId').value = '';
  
  // 生成额外字段
  generateExtraFields();
  
  // 显示模态框
  document.getElementById('configModal').classList.add('show');
}

// 编辑配置项
function editConfigItem(id) {
  // 获取配置项
  const configData = config[currentConfigType];
  currentConfigItem = configData.find(item => item.id === id);
  
  if (!currentConfigItem) {
    showAlert('配置项不存在或已被删除', 'danger');
    return;
  }
  
  // 设置模态框标题
  document.getElementById('modalTitle').textContent = `编辑${configTypes[currentConfigType].title.split('配置')[0]}`;
  
  // 填充表单数据
  document.getElementById('configId').value = currentConfigItem.id;
  document.getElementById('configName').value = currentConfigItem.name || '';
  document.getElementById('configDescription').value = currentConfigItem.description || '';
  
  // 生成额外字段
  generateExtraFields();
  
  // 显示模态框
  document.getElementById('configModal').classList.add('show');
}

// 删除配置项
function deleteConfigItem(id) {
  // 获取配置项
  const configData = config[currentConfigType];
  currentConfigItem = configData.find(item => item.id === id);
  
  if (!currentConfigItem) {
    showAlert('配置项不存在或已被删除', 'danger');
    return;
  }
  
  // 检查是否有依赖关系
  const dependencies = checkDependencies(currentConfigItem);
  
  // 设置删除提示
  document.getElementById('deleteItemName').textContent = currentConfigItem.name;
  
  // 如果有依赖关系，显示警告
  const deleteWarning = document.getElementById('deleteWarning');
  if (dependencies.length > 0) {
    deleteWarning.textContent = `此${configTypes[currentConfigType].title.split('配置')[0]}被以下配置引用：${dependencies.join('、')}，删除后可能导致数据不一致。`;
    deleteWarning.style.display = 'block';
  } else {
    deleteWarning.style.display = 'none';
  }
  
  // 显示删除确认模态框
  document.getElementById('deleteModal').classList.add('show');
}

// 确认删除配置项
function confirmDeleteConfigItem() {
  if (!currentConfigItem) return;
  
  try {
    // 获取配置数据
    let configData = config[currentConfigType];
    
    // 删除配置项
    configData = configData.filter(item => item.id !== currentConfigItem.id);
    
    // 更新配置数据
    config[currentConfigType] = configData;
    
    // 保存配置数据
    saveConfigData();
    
    // 重新渲染表格
    renderConfigTable();
    
    // 显示成功提示
    showAlert(`${configTypes[currentConfigType].title.split('配置')[0]}删除成功`, 'success');
  } catch (error) {
    console.error('删除配置项失败:', error);
    showAlert('删除配置项失败', 'danger');
  } finally {
    // 关闭删除模态框
    closeDeleteModal();
    
    // 重置当前配置项
    currentConfigItem = null;
  }
}

// 保存配置项
function saveConfigItem() {
  // 获取表单数据
  const id = document.getElementById('configId').value;
  const name = document.getElementById('configName').value.trim();
  const description = document.getElementById('configDescription').value.trim();
  
  // 验证必填字段
  if (!name) {
    showAlert('名称不能为空', 'danger');
    return;
  }
  
  // 获取额外字段数据
  const extraData = getExtraFieldData();
  
  // 验证额外字段
  if (!validateExtraFields(extraData)) {
    return;
  }
  
  try {
    // 获取配置数据
    let configData = config[currentConfigType];
    
    if (id) {
      // 编辑现有配置项
      const index = configData.findIndex(item => item.id === id);
      if (index >= 0) {
        configData[index] = {
          ...configData[index],
          name,
          description,
          ...extraData,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // 添加新配置项
      const newItem = {
        id: generateId(),
        name,
        description,
        ...extraData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 根据配置类型添加额外属性
      if (currentConfigType === 'domains') {
        newItem.brands = []; // 初始化为空数组
      } else if (currentConfigType === 'brands') {
        newItem.models = []; // 初始化为空数组
      } else if (currentConfigType === 'models') {
        newItem.baselines = []; // 初始化为空数组
      }
      
      configData.push(newItem);
    }
    
    // 更新配置数据
    config[currentConfigType] = configData;
    
    // 保存配置数据
    saveConfigData();
    
    // 重新渲染表格
    renderConfigTable();
    
    // 显示成功提示
    showAlert(`${configTypes[currentConfigType].title.split('配置')[0]}保存成功`, 'success');
    
    // 关闭模态框
    closeModal();
  } catch (error) {
    console.error('保存配置项失败:', error);
    showAlert('保存配置项失败', 'danger');
  }
}

// 生成额外字段
function generateExtraFields() {
  const extraFieldsContainer = document.getElementById('configExtraFields');
  extraFieldsContainer.innerHTML = '';
  
  // 获取当前配置类型的字段定义
  const fields = configTypes[currentConfigType].fields;
  
  fields.forEach(field => {
    if (field.name === 'name' || field.name === 'description') {
      // 这些字段在主表单中已经存在，跳过
      return;
    }
    
    // 创建字段容器
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-group';
    
    // 创建标签
    const label = document.createElement('label');
    label.htmlFor = `config${capitalizeFirstLetter(field.name)}`;
    label.className = 'form-label';
    label.textContent = field.label;
    if (field.required) {
      label.innerHTML += ' <span class="text-danger">*</span>';
    }
    
    // 创建输入控件
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.id = `config${capitalizeFirstLetter(field.name)}`;
      input.className = 'form-select';
      input.required = field.required;
      
      // 添加空选项
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = `请选择${field.label}`;
      input.appendChild(emptyOption);
      
      // 添加选项
      let options = [];
      if (field.name === 'domainId') {
        options = config.domains.map(domain => ({ id: domain.id, name: domain.name }));
      } else if (field.name === 'brandId') {
        options = config.brands.map(brand => ({ id: brand.id, name: brand.name }));
      }
      
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name;
        
        // 如果是编辑模式且值匹配，选中该选项
        if (currentConfigItem && currentConfigItem[field.name] === option.id) {
          optionElement.selected = true;
        }
        
        input.appendChild(optionElement);
      });
    } else if (field.type === 'multiselect') {
        // 对于multiselect类型，生成复选框组
        const checkboxGroup = document.createElement('div');
        checkboxGroup.id = `config${capitalizeFirstLetter(field.name)}`;
        checkboxGroup.className = 'form-check-group';
        
        // 添加全选复选框
        const selectAllItem = document.createElement('div');
        selectAllItem.className = 'form-check';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = `config${capitalizeFirstLetter(field.name)}_selectAll`;
        selectAllCheckbox.className = 'form-check-input';
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = `config${capitalizeFirstLetter(field.name)}_selectAll`;
        selectAllLabel.className = 'form-check-label';
        selectAllLabel.textContent = '全选';
        
        selectAllItem.appendChild(selectAllCheckbox);
        selectAllItem.appendChild(selectAllLabel);
        checkboxGroup.appendChild(selectAllItem);
        
        // 添加选项
        let items;
        if (field.name === 'domainIds') {
          items = config.domains;
        } else if (field.name === 'modelIds') {
          items = config.models;
        } else if (field.name === 'baselineIds') {
          items = config.baselines;
        }
        
        // 设置全选复选框的初始状态
        let isAllChecked = true;
        if (currentConfigItem) {
            // 编辑模式下检查是否所有选项都已被选中
            items.forEach(item => {
                if (!currentConfigItem[field.name] || !currentConfigItem[field.name].includes(item.id)) {
                    isAllChecked = false;
                }
            });
            selectAllCheckbox.checked = isAllChecked;
        } else {
            // 新增模式下默认全选
            selectAllCheckbox.checked = true;
        }
        
        const checkboxes = [];
        items.forEach(item => {
          const checkboxItem = document.createElement('div');
          checkboxItem.className = 'form-check';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `config${capitalizeFirstLetter(field.name)}_${item.id}`;
          checkbox.name = `config${capitalizeFirstLetter(field.name)}`;
          checkbox.value = item.id;
          checkbox.className = 'form-check-input';
          
          // 如果是编辑模式且值匹配，选中该选项
          const isChecked = currentConfigItem ? 
            (currentConfigItem[field.name] && currentConfigItem[field.name].includes(item.id)) : 
            true; // 默认全选
          checkbox.checked = isChecked;
          
          checkboxes.push(checkbox);
          
          const label = document.createElement('label');
          label.htmlFor = `config${capitalizeFirstLetter(field.name)}_${item.id}`;
          label.className = 'form-check-label';
          label.textContent = item.name;
          
          checkboxItem.appendChild(checkbox);
          checkboxItem.appendChild(label);
          checkboxGroup.appendChild(checkboxItem);
        });
        
        // 添加全选事件监听
        selectAllCheckbox.addEventListener('change', () => {
          checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
          });
        });
        
        // 添加单个复选框事件监听，用于更新全选状态
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            selectAllCheckbox.checked = checkboxes.every(cb => cb.checked);
          });
        });
        
        // 因为我们生成的是多个复选框，而不是单个select元素
        // 所以需要将checkboxGroup作为容器添加到字段容器中
        input = checkboxGroup;
    }
    
    // 添加到字段容器
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    
    // 添加到额外字段容器
    extraFieldsContainer.appendChild(fieldContainer);
  });
}

// 获取额外字段数据
function getExtraFieldData() {
  const extraData = {};
  
  // 获取当前配置类型的字段定义
  const fields = configTypes[currentConfigType].fields;
  
  fields.forEach(field => {
    if (field.name === 'name' || field.name === 'description') {
      // 这些字段在主表单中已经存在，跳过
      return;
    }
    
    const fieldId = `config${capitalizeFirstLetter(field.name)}`;
    
    if (field.type === 'multiselect') {
      // 处理复选框组，排除全选复选框
      const checkboxes = document.querySelectorAll(`#${fieldId} input[type="checkbox"]:not([id$="_selectAll"])`)
      const selectedValues = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
      extraData[field.name] = selectedValues;
    } else {
      // 处理普通字段
      const input = document.getElementById(fieldId);
      if (input) {
        extraData[field.name] = input.value;
      }
    }
  });
  
  return extraData;
}

// 验证额外字段
function validateExtraFields(extraData) {
  // 获取当前配置类型的字段定义
  const fields = configTypes[currentConfigType].fields;
  
  for (const field of fields) {
    if (field.name === 'name' || field.name === 'description') {
      // 这些字段在主表单中已经验证，跳过
      continue;
    }
    
    if (field.required && (!extraData[field.name] || 
        (Array.isArray(extraData[field.name]) && extraData[field.name].length === 0))) {
      showAlert(`${field.label}不能为空`, 'danger');
      return false;
    }
  }
  
  return true;
}

// 检查依赖关系
function checkDependencies(item) {
  const dependencies = [];
  
  if (currentConfigType === 'domains') {
    // 检查品牌是否引用该域控
    const dependentBrands = config.brands.filter(brand => 
      brand.domainIds && brand.domainIds.includes(item.id)
    );
    if (dependentBrands.length > 0) {
      dependencies.push(`${dependentBrands.length}个品牌`);
    }
    
    // 检查业务模块是否引用该域控
    const dependentModules = config.businessModules.filter(module => 
      module.domainIds && module.domainIds.includes(item.id)
    );
    if (dependentModules.length > 0) {
      dependencies.push(`${dependentModules.length}个业务模块`);
    }
  } else if (currentConfigType === 'brands') {
    // 检查车型是否引用该品牌
    const dependentModels = config.models.filter(model => model.brandId === item.id);
    if (dependentModels.length > 0) {
      dependencies.push(`${dependentModels.length}个车型`);
    }
  } else if (currentConfigType === 'models') {
    // 检查基线是否引用该车型
    const dependentBaselines = config.baselines.filter(baseline => 
      baseline.modelIds && baseline.modelIds.includes(item.id)
    );
    if (dependentBaselines.length > 0) {
      dependencies.push(`${dependentBaselines.length}个基线`);
    }
  } else if (currentConfigType === 'baselines') {
    // 检查车型是否引用该基线
    const dependentModels = config.models.filter(model => 
      model.baselineIds && model.baselineIds.includes(item.id)
    );
    if (dependentModels.length > 0) {
      dependencies.push(`${dependentModels.length}个车型`);
    }
  }
  
  return dependencies;
}

// 保存配置数据
async function saveConfigData() {
  try {
    localStorage.setItem('config', JSON.stringify(config));
  } catch (error) {
    console.error('保存配置数据失败:', error);
  }
}

// 关闭模态框
function closeModal() {
  document.getElementById('configModal').classList.remove('show');
  currentConfigItem = null;
}

// 关闭删除模态框
function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  currentConfigItem = null;
}

// 显示提示消息
function showAlert(message, type) {
  const alertElement = document.getElementById('alertMessage');
  
  // 设置提示类型
  alertElement.className = 'alert';
  alertElement.classList.add(`alert-${type}`);
  
  // 设置提示内容
  alertElement.textContent = message;
  
  // 显示提示
  alertElement.style.display = 'block';
  
  // 3秒后隐藏提示
  setTimeout(() => {
    alertElement.style.display = 'none';
  }, 3000);
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 首字母大写
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
