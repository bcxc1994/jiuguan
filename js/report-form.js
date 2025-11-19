/**
 * 酒馆日记本 - 周报录入模块
 * 负责周报录入页面的功能实现，包括数据联动、表单验证、自动保存等
 */

// 全局变量
let config = {
  domains: [],
  brands: [],
  models: [],
  baselines: [],
  businessModules: []
};



let currentReport = {
  id: null,
  userId: '',
  domainId: '',
  brandId: '',
  modelId: '',
  baselineId: '',
  startDate: '',
  endDate: '',
  content: [],
  status: 'draft',
  createdAt: '',
  updatedAt: ''
};

let autoSaveInterval = null;
let isAutoSaving = false;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否已登录
  if (!checkLogin()) {
    return;
  }
  
  // 初始化页面
  initReportForm();
});

// 初始化周报录入页面
function initReportForm() {
  // 显示用户信息
  displayUserInfo();
  
  // 设置导航权限
  setupNavigationPermissions();
  
  // 加载配置数据
  loadConfigData();
  
  // 检查是否有报告ID参数（编辑模式）
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');
  
  if (reportId) {
    // 加载报告数据
    loadReportData(reportId);
  } else {
    // 设置默认日期（当天）
    setDefaultDate();
    
    // 生成业务模块
    generateBusinessModules();
  }
  
  // 设置事件监听
  setupEventListeners();
  
  // 启动自动保存
  startAutoSave();
}

// 显示用户信息
function displayUserInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = `欢迎，${user.name}`;
    currentReport.userId = user.id;
  }
}

// 设置导航权限
function setupNavigationPermissions() {
  // 如果不是管理员，隐藏配置管理和用户管理导航
  if (!isAdmin()) {
    document.getElementById('configNavItem').style.display = 'none';
    document.getElementById('userManagementNavItem').style.display = 'none';
  }
}

// 加载配置数据
function loadConfigData() {
  const configData = JSON.parse(localStorage.getItem('config')) || {};
  
  config.domains = configData.domains || [];
  config.brands = configData.brands || [];
  config.models = configData.models || [];
  config.baselines = configData.baselines || [];
  config.businessModules = configData.businessModules || [];
  
  // 填充域控下拉框
  populateDomainSelect();
}

// 填充域控下拉框
function populateDomainSelect() {
  const domainSelect = document.getElementById('domainId');
  
  // 清空下拉框
  domainSelect.innerHTML = '<option value="">请选择域控</option>';
  
  // 添加域控选项
  config.domains.forEach(domain => {
    const option = document.createElement('option');
    option.value = domain.id;
    option.textContent = domain.name;
    domainSelect.appendChild(option);
  });
}

// 填充品牌下拉框
function populateBrandSelect(domainId) {
  const brandSelect = document.getElementById('brandId');
  
  // 清空下拉框
  brandSelect.innerHTML = '<option value="">请选择品牌</option>';
  
  // 筛选选中域控下的品牌
  const filteredBrands = config.brands.filter(brand => brand.domainId === domainId);
  
  // 添加品牌选项
  filteredBrands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.id;
    option.textContent = brand.name;
    brandSelect.appendChild(option);
  });
}

// 填充车型下拉框
function populateModelSelect(brandId) {
  const modelSelect = document.getElementById('modelId');
  
  // 清空下拉框
  modelSelect.innerHTML = '<option value="">请选择车型</option>';
  
  // 筛选选中品牌下的车型
  const filteredModels = config.models.filter(model => model.brandId === brandId);
  
  // 添加车型选项
  filteredModels.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    modelSelect.appendChild(option);
  });
}

// 填充基线下拉框
function populateBaselineSelect(modelId) {
  const baselineSelect = document.getElementById('baselineId');
  
  // 清空下拉框
  baselineSelect.innerHTML = '<option value="">请选择基线</option>';
  
  // 筛选选中车型下的基线
  const filteredBaselines = config.baselines.filter(baseline => baseline.modelId === modelId);
  
  // 添加基线选项
  filteredBaselines.forEach(baseline => {
    const option = document.createElement('option');
    option.value = baseline.id;
    option.textContent = baseline.name;
    baselineSelect.appendChild(option);
  });
}

// 设置默认日期（当天）
	function setDefaultDate() {
	  const today = new Date();
	  const todayStr = formatDate(today);
	  
	  // 设置日期输入框为当天
	  document.getElementById('reportDate').value = todayStr;
	  
	  // 更新当前报告对象
	  currentReport.startDate = todayStr;
	  currentReport.endDate = todayStr;
	}

// 生成业务模块
	function generateBusinessModules() {
	  const modulesContainer = document.getElementById('modulesContainer');
	  
	  // 清空容器
	  modulesContainer.innerHTML = '';
	  
	  // 获取选中的域控ID
	  const domainId = document.getElementById('domainId').value;
	  
	  // 筛选选中域控下的业务模块
  let filteredModules = config.businessModules;
  if (domainId) {
    filteredModules = config.businessModules.filter(module => 
      module.domainIds && module.domainIds.includes(domainId)
    );
  }
  // 移除没有id或name的无效模块
  filteredModules = filteredModules.filter(module => module.id && module.name);
	  
	  // 如果没有业务模块，显示提示
	  if (filteredModules.length === 0) {
	    modulesContainer.innerHTML = '<div class="alert alert-info">暂无可用的业务模块，请先配置业务模块或选择其他域控。</div>';
	    return;
	  }
	  
	  // 添加全选功能
	  const selectAllContainer = document.createElement('div');
	  selectAllContainer.className = 'mb-3';
	  selectAllContainer.innerHTML = `
	    <div class="form-check">
	      <input class="form-check-input" type="checkbox" id="selectAllModules">
	      <label class="form-check-label" for="selectAllModules">
	        全选业务模块
	      </label>
	    </div>
	  `;
	  modulesContainer.appendChild(selectAllContainer);
	  
	  // 绑定全选事件
	  const selectAllCheckbox = document.getElementById('selectAllModules');
	  selectAllCheckbox.addEventListener('change', function() {
	    const allModuleCheckboxes = document.querySelectorAll('.module-checkbox');
    allModuleCheckboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
	    updateReportContent();
	  });
	  
	  // 生成业务模块卡片
	  filteredModules.forEach(module => {
	    // 查找当前模块的内容（如果有）
	    const moduleContent = currentReport.content.find(item => item.moduleId === module.id) || {
	      moduleId: module.id,
	      workContent: ''
	    };
	    
	    // 创建模块卡片
    const moduleCard = document.createElement('div');
    moduleCard.className = 'module-card';
    moduleCard.dataset.moduleId = module.id;
    
    // 创建模块头部
    const moduleHeader = document.createElement('div');
    moduleHeader.className = 'module-header d-flex justify-content-between align-items-center';
    const hasWorkContent = moduleContent.workContent.trim() !== '';
    const isChecked = hasWorkContent;
    moduleHeader.innerHTML = `
      <div style="display: flex; align-items: center;">
        <input type="checkbox" id="module-${module.id}" class="module-checkbox" ${isChecked ? 'checked' : ''}>
        <label for="module-${module.id}" style="margin-left: 8px;">${module.name}</label>
      </div>

    `;
    
    // 创建模块内容
    const moduleBody = document.createElement('div');
    moduleBody.className = 'module-body';
    moduleBody.innerHTML = `
      <div class="form-group work-content-section" style='display: ${moduleContent.workContent ? "block" : "none"} !important;'>
        <div class="d-flex justify-content-between mb-2">
          <span class="work-content-label">工作内容</span>
          <button type="button" class="btn btn-sm btn-danger cancel-work-content-btn">取消</button>
        </div>
        <div class="work-content-container">
          <textarea class="form-control work-content" placeholder='请输入工作内容...' rows='5'>${moduleContent.workContent || ''}</textarea>
        </div>
      </div>
    `;
    
    // 如果模块已有工作内容，显示输入框
    if (hasWorkContent) {
      const workContent = moduleBody.querySelector('.work-content');
      workContent.style.display = 'block';
    }
	    
	    // 添加到模块卡片
	    moduleCard.appendChild(moduleHeader);
	    moduleCard.appendChild(moduleBody);
	    
	    // 添加到容器
	    modulesContainer.appendChild(moduleCard);
	    
	    // 设置事件监听
	    setupModuleCardEvents(moduleCard);
	  });
	}

// 设置模块卡片事件
	function setupModuleCardEvents(moduleCard) {
  const checkbox = moduleCard.querySelector('.module-checkbox');
  const toggle = moduleCard.querySelector('.module-toggle');
  const body = moduleCard.querySelector('.module-body');
  const workContent = moduleCard.querySelector('.work-content');
  const workContentSection = body.querySelector('.work-content-section');
  const cancelBtn = body.querySelector('.cancel-work-content-btn');
  
  // 复选框事件
  checkbox.addEventListener('change', function() {
    if (this.checked) {
      // 确保工作内容部分保持隐藏（除非已有内容）
      if (workContentSection && !workContent.value) {
        workContentSection.style.display = 'none';
      }
    }
    updateReportContent();
  });
  

  
  // 工作内容事件
  workContent.addEventListener('input', function() {
    updateReportContent();
  });
  

  
  // 取消按钮事件
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      // 清除工作内容
      workContent.value = '';
      // 隐藏工作内容部分
      if (workContentSection) {
        workContentSection.style.display = 'none';
      }
      // 更新报告内容
      updateReportContent();
    });
  }
  }

// 更新报告内容
	function updateReportContent() {
	  const moduleCards = document.querySelectorAll('.module-card');
	  
	  const newContent = [];
	  
	  moduleCards.forEach(card => {
	    const checkbox = card.querySelector('.module-checkbox');
	    if (checkbox.checked) {
	      const moduleId = card.dataset.moduleId;
	      const workContent = card.querySelector('.work-content').value.trim();
	      
	      newContent.push({
    moduleId,
    workContent
  });
	    }
	  });
	  
	  currentReport.content = newContent;
	}

// 加载报告数据
	function loadReportData(reportId) {
	  const reports = JSON.parse(localStorage.getItem('reports')) || [];
	  const report = reports.find(r => r.id === reportId);
	  
	  if (!report) {
	    showAlert('报告不存在或已被删除', 'danger');
	    setTimeout(() => {
	      window.location.href = 'dashboard.html';
	    }, 2000);
	    return;
	  }
	  
	  // 检查报告所有者或管理员权限
	  const currentUser = getCurrentUser();
	  if (report.userId !== currentUser.id && !isAdmin()) {
	    showAlert('您没有权限编辑此报告', 'danger');
	    setTimeout(() => {
	      window.location.href = 'dashboard.html';
	    }, 2000);
	    return;
	  }
	  
	  // 更新当前报告对象，确保没有多余字段
	  currentReport = {
	    ...report,
	    content: report.content.map(item => ({
	      moduleId: item.moduleId,
	      workContent: item.workContent || ''
	    }))
	  };
	  
	  // 填充表单数据
	  document.getElementById('reportId').value = report.id;
	  document.getElementById('domainId').value = report.domainId;
	  document.getElementById('reportDate').value = report.startDate;
	  
	  // 填充品牌下拉框并选择对应品牌
	  populateBrandSelect(report.domainId);
	  document.getElementById('brandId').value = report.brandId;
	  
	  // 填充车型下拉框并选择对应车型
	  populateModelSelect(report.brandId);
	  document.getElementById('modelId').value = report.modelId;
	  
	  // 填充基线下拉框并选择对应基线
	  populateBaselineSelect(report.modelId);
	  document.getElementById('baselineId').value = report.baselineId;
	  
	  // 生成业务模块
	  generateBusinessModules();
	}

// 设置事件监听
function setupEventListeners() {
  // 域控选择事件
  document.getElementById('domainId').addEventListener('change', function() {
    const domainId = this.value;
    currentReport.domainId = domainId;
    
    // 清空品牌、车型、基线选择
    document.getElementById('brandId').value = '';
    document.getElementById('modelId').value = '';
    document.getElementById('baselineId').value = '';
    
    // 填充品牌下拉框
    populateBrandSelect(domainId);
    
    // 重新生成业务模块
    generateBusinessModules();
  });
  
  // 品牌选择事件
  document.getElementById('brandId').addEventListener('change', function() {
    const brandId = this.value;
    currentReport.brandId = brandId;
    
    // 清空车型、基线选择
    document.getElementById('modelId').value = '';
    document.getElementById('baselineId').value = '';
    
    // 填充车型下拉框
    populateModelSelect(brandId);
  });
  
  // 车型选择事件
  document.getElementById('modelId').addEventListener('change', function() {
    const modelId = this.value;
    currentReport.modelId = modelId;
    
    // 清空基线选择
    document.getElementById('baselineId').value = '';
    
    // 填充基线下拉框
    populateBaselineSelect(modelId);
  });
  
  // 基线选择事件
  document.getElementById('baselineId').addEventListener('change', function() {
    currentReport.baselineId = this.value;
  });
  
  // 报告日期选择事件
  document.getElementById('reportDate').addEventListener('change', function() {
    currentReport.startDate = this.value;
    currentReport.endDate = this.value;
  });
  
  // 保存草稿按钮事件
  document.getElementById('saveDraftBtn').addEventListener('click', function() {
    saveReport('draft');
  });
  
  // 提交周报按钮事件
  document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveReport('submitted');
  });
  
  // 退出登录按钮事件
  document.getElementById('logoutBtn').addEventListener('click', function() {
    // 停止自动保存
    stopAutoSave();
    logout();
  });
  
  // 设置下拉菜单事件
  setupDropdownMenus();


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

// 启动自动保存
function startAutoSave() {
  // 每30秒自动保存一次
  autoSaveInterval = setInterval(() => {
    // 如果正在保存，跳过
    if (isAutoSaving) return;
    
    // 如果报告内容为空，跳过
    if (!currentReport.domainId || !currentReport.brandId || !currentReport.modelId || 
        !currentReport.baselineId || !currentReport.startDate ||
        currentReport.content.length === 0) {
      return;
    }
    
    // 显示自动保存提示
    showAutoSaveIndicator(true);
    
    // 保存报告
    saveReport('draft', true);
  }, 30000); // 30秒
}

// 停止自动保存
function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// 显示/隐藏自动保存提示
function showAutoSaveIndicator(show) {
  const indicator = document.getElementById('autosaveIndicator');
  
  if (show) {
    indicator.classList.add('show');
  } else {
    indicator.classList.remove('show');
  }
}

// 保存报告
	function saveReport(status, isAutoSave = false) {
	  // 如果是自动保存，设置标志
	  if (isAutoSave) {
	    isAutoSaving = true;
	  }
	  
	  // 更新报告状态
	  currentReport.status = status;
	  
	  // 获取当前时间
	  const now = new Date().toISOString();
	  
	  // 如果是新报告，设置创建时间
	  if (!currentReport.id) {
	    currentReport.id = generateId();
	    currentReport.createdAt = now;
	  }
	  
	  // 更新最后修改时间
	  currentReport.updatedAt = now;
	  
	  // 获取所有报告
	  let reports = JSON.parse(localStorage.getItem('reports')) || [];
	  
	  // 检查报告是否已存在
	  const reportIndex = reports.findIndex(r => r.id === currentReport.id);
	  
	  if (reportIndex >= 0) {
	    // 更新现有报告
	    reports[reportIndex] = currentReport;
	  } else {
	    // 添加新报告
	    reports.push(currentReport);
	  }
	  
	  // 保存报告数据
	  localStorage.setItem('reports', JSON.stringify(reports));
	  
	  // 隐藏自动保存提示
	  showAutoSaveIndicator(false);
	  
	  // 如果是自动保存，重置标志
	  if (isAutoSave) {
	    isAutoSaving = false;
	    return;
	  }
	  
	  // 显示成功提示
	  if (status === 'draft') {
	    showAlert('草稿已保存', 'success');
	  } else {
	    showAlert('报告已提交', 'success');
	    
	    // 2秒后跳转到首页
	    setTimeout(() => {
	      window.location.href = 'dashboard.html';
	    }, 2000);
	  }
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

// 格式化日期
function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

// 数字补零
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}
