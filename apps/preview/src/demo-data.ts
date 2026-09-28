export type DemoItem={id:string;title:string;description:string;status:'active'|'paused';updatedAt:string;category:string};
export const items:DemoItem[]=[
 {id:'schedule',title:'课表订阅',description:'把课程安排同步到常用的日历应用。',status:'active',updatedAt:'2026-09-28',category:'学习工具'},
 {id:'account',title:'统一账号',description:'在一个地方管理个人资料与账号偏好。',status:'active',updatedAt:'2026-09-27',category:'账号服务'},
 {id:'library',title:'资料库',description:'整理课程资料，让需要的内容更容易找到。',status:'active',updatedAt:'2026-09-26',category:'学习工具'},
 {id:'evaluation',title:'教学评价',description:'查看评价进度与已完成的记录。',status:'paused',updatedAt:'2026-09-25',category:'学习工具'},
 {id:'notifications',title:'消息通知',description:'集中查看课程变动与重要服务消息。',status:'active',updatedAt:'2026-09-24',category:'账号服务'},
 {id:'archive',title:'课程资料归档与跨学期历史记录查询服务',description:'保留跨学期记录，长标题也可以完整查看。',status:'paused',updatedAt:'2026-09-23',category:'学习工具'},
];
