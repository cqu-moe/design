import { useState } from 'react';
import {
  Button,
  Switch,
  Input,
  Label,
  Textarea,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@cqu-moe/ui';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Monitor,
  ShieldCheck,
} from 'lucide-react';

// 文案来源和内容映射记录在 docs/brand-direction-proposal.md。
export const products = {
  quicklogin: {
    name: 'QuickLogin',
    kind: '桌面 Chrome 扩展 · 内测中',
    title: ['少一次登录，', '多一点顺畅。'],
    description:
      '让学校统一认证的登录状态，跟上你的日常。QuickLogin 在后台同步会话，减少重复输入，把时间留给真正要做的事。',
    requirement: '需要桌面 Chrome 和已有内测资格的 CQU Auth 账号。',
    availability: '当前暂未开放内测申请。',
    valueTitle: '重复登录的事，\n交给 QuickLogin。',
    features: [
      [
        '减少重复输入',
        '通过 CQU Auth 维护学校会话，将统一认证所需 Cookie 同步到当前浏览器。需要学校验证时，会提示你完成下一步。',
      ],
      [
        '每台设备，独立授权',
        '每次安装都有独立授权。在 Auth 中查看、管理或撤销设备；插件开关只控制当前浏览器。',
      ],
      [
        '已有登录，由你决定',
        '保护浏览器中已有的学校登录。继续使用它，或明确确认后切换为 QuickLogin 会话。',
      ],
    ],
    steps: [
      [
        '下载并解压',
        '前往下载页，登录 Auth 确认内测资格。将 ZIP 解压到固定文件夹，后续保留这个目录。',
        '前往下载页',
        'https://quicklogin.cqu.moe/download/',
      ],
      [
        '加载到 Chrome',
        '打开 chrome://extensions，开启“开发者模式”，选择“加载已解压的扩展程序”，选中包含 manifest.json 的目录。',
        '查看图文安装指南',
        'https://quicklogin.cqu.moe/download/#install',
      ],
      [
        '连接 CQU Auth',
        '打开插件并完成授权。学校账号绑定或额外验证在 Auth 中完成；插件显示“已就绪”后，即已确认当前会话同步。',
        '',
        '',
      ],
    ],
    maintenanceTitle: '更新时，保留原安装目录。',
    maintenance:
      '内测 ZIP 不会自动更新。下载新版覆盖原目录，再到 Chrome 扩展管理页点击重载。避免先卸载重装，导致重复占用设备名额。',
    faq: [
      [
        '谁现在可以使用？手机可以安装吗？',
        '当前安装包仅向已有内测资格的 CQU Auth 用户提供，暂未开放申请。安装指南面向桌面 Chrome；手机可以阅读指南，其他 Chromium 浏览器尚未纳入正式支持范围。',
      ],
      [
        '插件会读取我的学校密码吗？',
        '插件不读取或保存学校密码，只同步学校统一认证域名限定范围内的 Cookie。账号绑定和会话管理由 Auth 处理，具体数据使用方式见隐私说明。',
      ],
      [
        '“已就绪”代表所有学校服务都能直接进入吗？',
        '它表示当前会话已完成同步确认。具体学校服务仍可能要求额外验证、受到服务状态影响，或使用其他登录方式。',
      ],
      [
        '已有学校登录，或需要重新连接时怎么办？',
        '已有学校登录会被保留；只有你明确选择切换时才使用 QuickLogin 会话。需要重新连接时，前往 Auth 按提示恢复原设备授权，保留原安装目录和设备记录。',
      ],
      [
        '关闭快捷登录和退出设备有什么区别？',
        '关闭插件开关只暂停当前浏览器的快捷登录；退出设备会撤销它的授权。Auth 网站总开关影响整个账号。',
      ],
    ],
    resources: [
      ['使用帮助', 'https://quicklogin.cqu.moe/faq/'],
      ['隐私说明', 'https://quicklogin.cqu.moe/privacy/'],
      ['更新记录', 'https://quicklogin.cqu.moe/changelog/'],
      ['管理账号与设备', 'https://auth.cqu.moe/settings'],
    ],
  },
  jxzljc: {
    name: '快速评教',
    kind: '重庆大学 · Tampermonkey 用户脚本',
    title: ['评教，', '少填几遍。'],
    description:
      '评分和评语统一设置一次，已有草稿会保留。提交前，逐门查看、修改，再确认。把重复填写的时间，留给真实反馈。',
    requirement: '需要 Tampermonkey，以及已登录的学校学生评教页面。',
    availability: '免费开源 · MIT 许可证 · 建议使用桌面浏览器',
    valueTitle: '重复的内容填一次，\n每门课依然认真对待。',
    features: [
      [
        '已有草稿，会好好保留',
        '统一设置只补充空白内容。课程中已有的评分与评语会保留，不用担心之前认真写下的反馈被覆盖。',
      ],
      [
        '逐门核对，再决定提交',
        '在预览中选择课程、检查评价，并按每门课的实际情况修改。评分不预选，提交需要你明确确认。',
      ],
      [
        '过程看得见，也能停下来',
        '逐项展示处理进度。遇到失败或结果不明确会停止；主动停止时，等待当前请求核验完成，再停止后续课程。',
      ],
    ],
    steps: [
      [
        '安装 Tampermonkey',
        '从官网选择浏览器对应的扩展商店，安装并启用。Chrome / Edge 还需按官方说明允许用户脚本运行。',
        '获取 Tampermonkey',
        'https://www.tampermonkey.net/',
      ],
      [
        '安装快速评教脚本',
        '打开 Greasy Fork 安装页，在 Tampermonkey 中确认安装并保持启用。Greasy Fork 与 GitHub 安装源选择其一，不要重复安装。',
        '从 Greasy Fork 安装',
        'https://greasyfork.org/zh-CN/scripts/601134',
      ],
      [
        '进入学校评教页面',
        '使用校园网络，按平常方式登录学生评教页面。安装后刷新页面，从右下角打开工具；已有单课窗口先保存并关闭。',
        '打开学校学生评教',
        'http://jxzljc.cqu.edu.cn/xspj/xspj/index/xspjindex',
      ],
      [
        '填写、核对、确认',
        '按真实体验选择档位、综合评分和可选评语。下一步选择课程、逐门核对，确认后才开始提交；同一时间只在一个标签页操作。',
        '',
        '',
      ],
    ],
    maintenanceTitle: '由 Tampermonkey 检查脚本更新。',
    maintenance:
      '通过 Greasy Fork 安装会跟随该站更新；GitHub 安装跟随仓库 main。页面刷新后不会自动续跑，也不会保留临时设置。提交后以学校系统结果为准。',
    faq: [
      [
        '会默认给满分，或自动提交全部课程吗？',
        '不会。档位和分数都需要你主动选择；统一设置只补充空白内容。预览时选择要处理的课程，可以逐门修改，确认后才提交。请根据真实上课体验评价。',
      ],
      [
        '已经写好的草稿会被覆盖吗？',
        '已有评分与评语会保留。预览中的修改仅用于这次提交，不覆盖学校本地草稿；原草稿变化后，需要重新核对生成的提交计划。',
      ],
      [
        '账号、密码和评价内容会传给第三方吗？',
        '脚本使用学校页面已有的登录会话，调用同源接口。不收集账号密码，也不把评价内容上传给第三方。这里展示的界面使用合成数据。',
      ],
      [
        '安装后没有出现按钮怎么办？',
        '确认 Tampermonkey 与脚本均已启用，并允许用户脚本运行。在学校学生评教页面刷新；工具不会出现在所有学校网页上。下面的资源区提供权限设置说明。',
      ],
      [
        '哪些课程可以使用？',
        '面向当前学期未完成的评价，已验证 A–E 五档的理论课与实验课。未知题型会停止。建议桌面浏览器，移动端扩展与真实设备尚未充分验证。',
      ],
      [
        '失败、停止或刷新后会怎样？',
        '失败或结果不明确时停止，不会自动重试；停止操作会等当前请求核验完成后再停止后续课程。刷新不会自动续跑。请回到学校系统核对结果，已提交评价能否修改以学校规则为准。',
      ],
      [
        '这是学校官方工具吗？遇到问题如何反馈？',
        '这是 CQU Moe 提供的非官方开源工具，最终结果以学校系统为准。可以通过 GitHub Issues 反馈浏览器版本和脱敏后的现象，不要附带账号、课程、教师信息或会话凭据。',
      ],
    ],
    resources: [
      ['GitHub 源码', 'https://github.com/cqu-moe/jxzljc'],
      ['问题反馈', 'https://github.com/cqu-moe/jxzljc/issues'],
      ['MIT 许可证', 'https://github.com/cqu-moe/jxzljc/blob/main/LICENSE'],
      ['用户脚本权限说明', 'https://www.tampermonkey.net/faq.php?locale=zh&q=Q209'],
      ['GitHub 备用安装源', 'https://raw.githubusercontent.com/cqu-moe/jxzljc/main/jxzljc.user.js'],
    ],
  },
};
export type ProductId = keyof typeof products;
export type Product = (typeof products)[ProductId];
export type LandingProps = { product: Product; id: ProductId; onEnter: () => void };

export function Mark({ id }: { id: string }) {
  return (
    <span
      className="brand-mark"
      aria-hidden="true"
      style={{
        maskImage: `url("/brand/${id}/logo-black.svg")`,
      }}
    />
  );
}

export function Intro({ product, onEnter }: LandingProps) {
  return (
    <div className="hero-copy">
      <p className="eyebrow">{product.kind}</p>
      <h1>
        {product.title[0]}
        <br />
        <span>{product.title[1]}</span>
      </h1>
      <p className="hero-description">{product.description}</p>
      <div className="hero-actions">
        <Button asChild className="marketing-action">
          <a href="#install">
            开始安装
            <ArrowDown aria-hidden="true" />
          </a>
        </Button>
        <Button variant="ghost" onClick={onEnter}>
          看看工作界面
          <ArrowUpRight aria-hidden="true" />
        </Button>
      </div>
      <p className="hero-availability">{product.availability}</p>
    </div>
  );
}

export function QuickPanel({
  state = 0,
  embedded = false,
}: {
  state?: number;
  embedded?: boolean;
}) {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className={`quick-panel${embedded ? ' quick-session' : ''}`}>
      {!embedded && (
        <div className="panel-brand">
          <Mark id="quicklogin" />
          <strong>QuickLogin</strong>
        </div>
      )}
      {embedded && (
        <div className="session-route" role="group" aria-label="学校会话同步关系示意">
          <div className="session-endpoint">
            <Mark id="auth" />
            <strong>CQU Auth</strong>
            <span>管理学校会话</span>
          </div>
          <div className="session-bridge" aria-hidden="true">
            <span />
            <ArrowRight />
          </div>
          <div className="session-endpoint">
            <Monitor aria-hidden="true" />
            <strong>当前浏览器</strong>
            <span>每台设备独立授权</span>
          </div>
        </div>
      )}
      <div className="quick-status">
        {state === 0 ? (
          <div className="ready-check">
            <Check aria-hidden="true" />
          </div>
        ) : (
          <ShieldCheck className="state-icon" aria-hidden="true" />
        )}
        <span>当前状态 · 演示</span>
        <strong>{!enabled ? '已暂停' : ['已就绪', '已有学校登录', '需要恢复授权'][state]}</strong>
        <p>
          {!enabled
            ? '当前浏览器的快捷登录已暂停。'
            : [
                '当前会话已完成同步确认。',
                '继续使用已有登录，切换前由你确认。',
                '在 Auth 中按提示恢复原设备授权。',
              ][state]}
        </p>
      </div>
      {embedded && (
        <dl className="session-facts">
          <div>
            <dt>同步范围</dt>
            <dd>学校统一认证 Cookie</dd>
          </div>
          <div>
            <dt>学校密码</dt>
            <dd>插件不读取、不保存</dd>
          </div>
        </dl>
      )}
      <div className="quick-control">
        <label htmlFor="quick-switch">当前浏览器快捷登录</label>
        <Switch id="quick-switch" checked={enabled} onCheckedChange={setEnabled} />
      </div>
    </div>
  );
}

export function ProductSample({ id }: Pick<LandingProps, 'id'>) {
  const [step, setStep] = useState(0);
  const evaluation = id === 'jxzljc';
  const tabs = evaluation
    ? ['填写设置', '逐课核对', '提交进度']
    : ['会话就绪', '已有登录', '恢复授权'];
  return (
    <div className={`product-stage ${evaluation ? 'evaluation-stage' : ''}`}>
      <div className="demo-window">
        <div className="demo-header">
          <span>
            <Mark id={id} />
            <strong>{products[id].name}</strong>
          </span>
          <span className="demo-label">交互示例</span>
        </div>
        <div className="stage-tabs" aria-label="切换演示状态">
          {tabs.map((tab, index) => (
            <Button
              className="preview-tab"
              key={tab}
              variant="ghost"
              aria-pressed={step === index}
              onClick={() => setStep(index)}
            >
              <span className="tab-number">0{index + 1}</span>
              {tab}
            </Button>
          ))}
        </div>
        <div className="stage-body">
          {evaluation ? (
            <EvaluationSample step={step} onStep={setStep} />
          ) : (
            <QuickPanel key={step} state={step} embedded />
          )}
        </div>
      </div>
    </div>
  );
}

function EvaluationSample({ step, onStep }: { step: number; onStep: (value: number) => void }) {
  const [grade, setGrade] = useState('满意');
  const [score, setScore] = useState('90');
  const [comment, setComment] = useState('讲解清楚，希望增加课堂练习。');
  const [selected, setSelected] = useState(['A', 'B', 'C']);
  return (
    <div className="evaluation-sample">
      <div className="sample-content">
        {step === 0 ? (
          <form
            id="sample-form"
            onSubmit={(event) => {
              event.preventDefault();
              onStep(1);
            }}
          >
            <div className="sample-intro">
              <h3>统一评价设置</h3>
              <p>只补充空白内容，已有草稿会保留。</p>
            </div>
            <div className="sample-fields">
              <div>
                <Label htmlFor="sample-grade">满意度档位</Label>
                <Select value={grade} onValueChange={setGrade} required>
                  <SelectTrigger className="w-full text-base" id="sample-grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['非常满意', '满意', '一般满意', '不满意', '非常不满意'].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sample-score">综合评分</Label>
                <Input
                  className="text-base"
                  id="sample-score"
                  type="number"
                  min={2}
                  max={95}
                  required
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  aria-describedby="sample-score-help"
                />
                <p id="sample-score-help">示例允许 2–95 分</p>
              </div>
            </div>
            <div className="sample-comment">
              <Label htmlFor="sample-comment">统一评语</Label>
              <Textarea
                className="text-base"
                id="sample-comment"
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>
          </form>
        ) : step === 1 ? (
          <div>
            <div className="sample-intro">
              <h3>逐门核对评价</h3>
              <p>选择示例课程，检查将要使用的内容。</p>
            </div>
            <div className="sample-courses">
              {['A', 'B', 'C'].map((course) => (
                <label className="sample-course" key={course}>
                  <Checkbox
                    checked={selected.includes(course)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, course]
                          : current.filter((value) => value !== course),
                      )
                    }
                  />
                  <span>
                    <strong>示例课程 {course}</strong>
                    <small>
                      {grade} · {score} 分
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <p className="sample-comment-preview">{comment || '未填写评语'}</p>
          </div>
        ) : (
          <div className="sample-complete">
            <div className="completion-mark">
              <Check aria-hidden="true" />
            </div>
            <h3>评价完成后的样子</h3>
            <p>
              这里预览 {selected.length} 门示例课程的完成状态。
              <br />
              没有向学校提交任何评价。
            </p>
            <div className="sample-progress" role="img" aria-label="模拟完成进度 100%" />
            <span>
              演示进度 <strong>100%</strong>
            </span>
          </div>
        )}
      </div>
      <div className="sample-footer">
        <span>
          {step === 0
            ? '已填入示例值'
            : step === 1
              ? `已选 ${selected.length} 门示例课程`
              : '仅演示，不提交'}
        </span>
        {step === 0 ? (
          <Button type="submit" form="sample-form">
            核对示例
            <ArrowUpRight aria-hidden="true" />
          </Button>
        ) : step === 1 ? (
          <Button type="button" disabled={selected.length === 0} onClick={() => onStep(2)}>
            预览完成状态
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              // 保留按钮焦点，并阻止这次点击提交刚重新出现的表单。
              event.preventDefault();
              onStep(0);
            }}
          >
            重新查看
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductDetails({ id, product }: Pick<LandingProps, 'id' | 'product'>) {
  return (
    <div className="product-details">
      <section className="feature-section section-grid" id="features">
        <div className="section-heading">
          <p className="eyebrow">功能与边界</p>
          <h2>{product.valueTitle}</h2>
        </div>
        <div className="feature-list">
          {product.features.map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="install-section section-grid" id="install">
        <div className="section-heading">
          <p className="eyebrow">开始使用</p>
          <h2>
            准备好，
            <br />
            再开始。
          </h2>
          <p>{product.requirement}</p>
          <p className="install-note">{product.availability}</p>
        </div>
        <div>
          <ol className="install-steps">
            {product.steps.map(([title, copy, label, url], index) => (
              <li key={title}>
                <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  {url && (
                    <a className="text-link" href={url} target="_blank" rel="noreferrer">
                      {label}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <aside className="maintenance">
            <h3>{product.maintenanceTitle}</h3>
            <p>{product.maintenance}</p>
          </aside>
        </div>
      </section>
      <section className="faq-section section-grid" id="faq">
        <div className="section-heading">
          <p className="eyebrow">常见问题</p>
          <h2>
            用之前，
            <br />
            你可能想知道。
          </h2>
        </div>
        <div className="faq-list">
          {product.faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="resource-section section-grid" id="resources">
        <div className="section-heading">
          <p className="eyebrow">{id === 'jxzljc' ? '开源与支持' : '文档与支持'}</p>
          <h2>{id === 'jxzljc' ? '代码公开，\n问题也有去处。' : '需要帮助，\n从这里继续。'}</h2>
        </div>
        <div className="resource-list">
          {product.resources.map(([label, url]) => (
            <a href={url} target="_blank" rel="noreferrer" key={label}>
              {label}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
