// injected.js
const generators = {
  // 中文姓名随机化
  name: () => {
    const surnames = ['王','李','张','刘','陈','杨','赵','黄','周','吴'];
    const givenNames = ['伟','芳','娜','敏','静','强','磊','军','洋','勇'];
    return surnames[Math.floor(Math.random()*surnames.length)] +
        givenNames[Math.floor(Math.random()*givenNames.length)];
  },
  // 新增英文姓名生成
  name_en: () => {
    const firstNames = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Daniel'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Taylor'];
    return `${firstNames[Math.floor(Math.random()*firstNames.length)]} ${
        lastNames[Math.floor(Math.random()*lastNames.length)]}`;
  },
  phone: () => {
    const prefix = ['139','138','136','188','199','135','150','151'];
    return prefix[Math.floor(Math.random()*prefix.length)] +
        Math.random().toString().slice(2,11).padEnd(8,'0').slice(0,8);
  },
  idcard: () => {
    const areas = ['110101','310115','440106','440304'];
    const area = areas[Math.floor(Math.random()*areas.length)];
    const year = 1980 + Math.floor(Math.random()*30);
    const month = (1 + Math.floor(Math.random() * 11)).toString().padStart(2, '0');
    const day = (1 + Math.floor(Math.random() * 27)).toString().padStart(2, '0');
    const seq = Math.random().toString().slice(2, 6);
    return `${area}${year}${month}${day}${seq}X`;
  },
  // 中文公司名随机化
  company: () => {
    const prefixes = ['鑫', '华', '国', '东方', '新'];
    const suffixes = ['科技', '实业', '集团', '商贸', '电子'];
    return `${prefixes[Math.floor(Math.random()*prefixes.length)]}${
        suffixes[Math.floor(Math.random()*suffixes.length)]}有限公司`;
  },
  // 新增英文公司名
  company_en: () => {
    const companyTypes = ['LLC', 'Inc.', 'Group', 'Holdings', 'Corp'];
    const words = ['Global','Alpha','Omega','Vertex','Prime','Zenith','Apex'];
    return `${words[Math.floor(Math.random()*words.length)]} ${
        words[Math.floor(Math.random()*words.length)]} ${
        companyTypes[Math.floor(Math.random()*companyTypes.length)]}`;
  },
  uscc: () => '91' + Math.random().toString().slice(2,8) +
      'MA1FP' + Math.random().toString().slice(2,8).toUpperCase().slice(0,6),
  email: () => `test${Math.random().toString(36).slice(2,8)}@${
      ['gmail','hotmail','yahoo','example'][Math.floor(Math.random()*4)]}.com`,
  // 中文地址增强
  address: () => {
    const cities = ['北京市','上海市','广州市','深圳市'];
    const streets = ['长安街','人民路','解放路','中山路'];
    return `${cities[Math.floor(Math.random()*cities.length)]}${
        Math.floor(Math.random()*8)+1}区${
        streets[Math.floor(Math.random()*streets.length)]}${
        Math.floor(Math.random()*200)+1}号`;
  },
  // 新增英文地址
  address_en: () => {
    const streets = ['Main St', '5th Ave', 'Park Ave', 'Elm St'];
    return `${Math.floor(Math.random()*2000)+100} ${
        streets[Math.floor(Math.random()*streets.length)]}, ${
        ['New York', 'London', 'San Francisco'][Math.floor(Math.random()*3)]}`;
  },
  date: () => new Date().toISOString().split('T')[0]
};

const fieldPatterns = {
  name: [/姓名|name|姓名|姓名（中文）|xm|真实姓名/i],
  address: [/地址|address|住址|所在地/i],
  phone: [/手机|电话|mobile|phone/i],
  idcard: [/身份证|idcard|identity/i],
  uscc: [/统一信用|信用代码|uscc|社会信用/i],
  email: [/邮箱|email|邮件/i],
  name_en: [/英文名|ename|english name|first name/i],
  company: [
    /公司名称?|企业名称?|company|org(?:anization)?/i,
    /^(?!.*en)(?=.*(公司|企业)).*$/ // 排除包含英文的字段
  ],
  company_en: [
    /company.?name.?en|en_company|english company/i,
    /^(?=.*en)(?=.*(公司|企业)).*$/i // 同时包含中英文关键字的场景
  ],
  address_en: [/英文地址|en_address|english address/i],
  date: [/日期|date|时间/i]
};

function detectFieldType(input) {
  // 提取所有相关文本特征（包含独立提取placeholder）
  const context = {
    id: input.id.toLowerCase(),
    name: input.name.toLowerCase(),
    placeholder: (input.placeholder || '').toLowerCase(),
    ariaLabel: (input.getAttribute('aria-label') || '').toLowerCase(),
    labels: [
      ...(input.labels || []),
      input.closest('label')
    ]
        .filter(Boolean)
        .map(el => el.textContent.toLowerCase())
        .join(' ')
  };

  // 调试信息输出
  console.debug('字段上下文:', JSON.stringify(context));

  // 核心匹配逻辑（优先级排序）
  const typeDetectors = [
    //----- 邮箱类 -----
    {
      type: 'email',
      patterns: [
        /(邮箱|邮件|e-?mail)/,
        // 处理placeholder类似："name@example.com"
        () => context.placeholder.includes('邮箱') || context.placeholder.includes('邮件')
      ]
    },

    //----- 电话类 -----
    {
      type: 'phone',
      patterns: [
        /(电话|手机|移动电话|联系方式)/,
        /(\bphone|mobile\b)/,
        // 处理placeholder类似："13800138000"
        () => context.placeholder.includes('电话') || context.placeholder.includes('手机')
      ]
    },

    //----- 公司相关 -----
    {
      type: 'company',
      patterns: [
        /^(公司|企业)(名称|名)?$/, // 匹配placeholder纯中文
        /(公司名称|企业全称)/,
        // 排除包含"英文"的情况
        (text) => (text.includes('公司名') || text.includes('企业全称') ||text.includes('企业名'))&& !text.includes('英文')
      ]
    },
    {
      type: 'company_en',
      patterns: [
        /(公司英文名|企业英文名称)/,
        /(english company|en_company)/,
        // 处理placeholder类似："Enter company name in English"
        (text) => text.includes('公司英文名') || text.includes('企业英文名')
      ]
    },

    //----- 其他字段 -----
    {
      type: 'name',
      patterns: [
        /^(姓名|名字|联系人)$/, // 匹配placeholder纯姓名
        /(姓名|名字)[：:]?$/,
          (text) => (text.includes('姓名') || text.includes('名字') ||  text.includes('名称'))&& !text.includes('英文')
      ]
    },
    {
      type: 'name_en',
      patterns: [
        /英文名/,
        /(english name)/,
        // 处理placeholder类似："First name / Last name"
        (text) => text.includes('英文名')
      ]
    },
      {
        type: 'address',
        patterns: [
          /^(地址|地址|地址|所在地)$/, // 匹配placeholder纯地址
          /(地址|地址|地址|所在地)[：:]?$/,
              (text) => (text.includes('地址') || text.includes('所在地')) && !text.includes('英文')
        ]
      },
      {
        type: 'address_en',
        patterns: [
            /地址（英文）/,
            /(address.?en|en_address)/,
            (text) => text.includes('地址（英文）') || (text.includes('地址') && text.includes('英文'))
        ]
      },
      {
        type: 'date',
        patterns: [
          /^(日期|日期)$/, // 匹配placeholder纯日期
          /(日期|日期)[：:]?$/,
              (text) => text.includes('日期')
        ]
      },
      {
        type: 'idcard',
        patterns: [
          /^(身份证|身份证|身份证|身份证)$/, // 匹配placeholder纯身份证
          /(身份证|身份证|身份证|身份证)[：:]?$/,
              (text) => text.includes('身份证')
        ]
      },
      {
        type: 'uscc',
        patterns: [
            /^(统一信用|信用代码|统一信用代码|统一信用代码)$/,
            (text) => text.includes('统一信用') || text.includes('信用代码') || text.includes('企业证件号码')
        ],
      }
  ];

  // 特征聚合（优先处理placeholder）
  const searchText = [
    context.placeholder, // placeholder具有最高优先级
    context.labels,
    context.ariaLabel,
    context.id,
    context.name
  ].join(' ');

  // 执行类型检测
  for (const detector of typeDetectors) {
    const isMatch = detector.patterns.some(pattern => {
      if (typeof pattern === 'function') {
        return pattern(searchText);
      }
      return pattern.test(searchText);
    });

    if (isMatch) {
      console.log(`识别成功: ${detector.type}`, `特征: ${searchText}`);
      return detector.type;
    }
  }

  // 特殊类型回退（HTML5输入类型）
  switch (input.type) {
    case 'email':
      return 'email';
    case 'tel':
      return 'phone';
    case 'date':
      return 'date';
  }

  return null;
}

window.autoFillAllFields = function() {
  document.querySelectorAll('input, textarea, select').forEach(input => {
    if (input.disabled || input.readOnly || input.value.trim()) return;

    const fieldType = detectFieldType(input);
    if (!fieldType || !generators[fieldType]) {
      console.warn('未识别字段类型:', input);
      return;
    }

    try {
      input.value = generators[fieldType]();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`已填充 ${fieldType}:`, input.value);
    } catch (error) {
      console.error('填充失败:', error);
    }
  });
};

window.fillSelectedField = function(type) {
  const activeElement = document.activeElement;
  console.log('[扩展] 正在填充:', type);
  if (activeElement && generators[type]) {
    activeElement.value = generators[type]();
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
};