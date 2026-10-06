/** 幼儿图形库：emoji + 中文名称，供宾果卡 / 找找看 等模块共用 */

export interface PictureItem {
  emoji: string
  label: string
}

export interface PictureSet {
  id: string
  label: string
  items: readonly PictureItem[]
}

const item = (emoji: string, label: string): PictureItem => ({ emoji, label })

export const PICTURE_SETS: readonly PictureSet[] = [
  {
    id: 'animals',
    label: '可爱动物',
    items: [
      item('🐶', '小狗'),
      item('🐱', '小猫'),
      item('🐭', '小老鼠'),
      item('🐰', '兔子'),
      item('🐻', '小熊'),
      item('🐼', '熊猫'),
      item('🐷', '小猪'),
      item('🐸', '青蛙'),
      item('🐵', '小猴'),
      item('🦊', '狐狸'),
      item('🐔', '小鸡'),
      item('🐧', '企鹅'),
      item('🐦', '小鸟'),
      item('🦆', '鸭子'),
      item('🐝', '蜜蜂'),
      item('🦋', '蝴蝶'),
      item('🐢', '乌龟'),
      item('🐠', '小鱼'),
      item('🐳', '鲸鱼'),
      item('🦄', '独角兽'),
      item('🐙', '章鱼'),
      item('🦀', '螃蟹'),
      item('🦉', '猫头鹰'),
      item('🐿️', '松鼠')
    ]
  },
  {
    id: 'fruits',
    label: '时令水果',
    items: [
      item('🍎', '苹果'),
      item('🍐', '梨'),
      item('🍊', '橘子'),
      item('🍋', '柠檬'),
      item('🍌', '香蕉'),
      item('🍉', '西瓜'),
      item('🍇', '葡萄'),
      item('🍓', '草莓'),
      item('🍒', '樱桃'),
      item('🍑', '桃子'),
      item('🥝', '猕猴桃'),
      item('🍍', '菠萝'),
      item('🥭', '芒果'),
      item('🍅', '西红柿'),
      item('🥑', '牛油果'),
      item('🍆', '茄子'),
      item('🥕', '胡萝卜'),
      item('🌽', '玉米'),
      item('🌶️', '辣椒'),
      item('🧄', '大蒜'),
      item('🥔', '土豆'),
      item('🍠', '红薯'),
      item('🥥', '椰子'),
      item('🫐', '蓝莓')
    ]
  },
  {
    id: 'vehicles',
    label: '交通工具',
    items: [
      item('🚗', '汽车'),
      item('🚌', '公交车'),
      item('🚕', '出租车'),
      item('🚓', '警车'),
      item('🚑', '救护车'),
      item('🚚', '卡车'),
      item('🚜', '拖拉机'),
      item('🛵', '滑板摩托'),
      item('🏍️', '摩托车'),
      item('🚲', '自行车'),
      item('🛴', '滑板车'),
      item('🚂', '火车'),
      item('🚄', '高铁'),
      item('🚅', '动车'),
      item('🚈', '轻轨'),
      item('🚢', '轮船'),
      item('⛵', '帆船'),
      item('🚁', '直升机'),
      item('✈️', '飞机'),
      item('🚀', '火箭'),
      item('🛰️', '卫星'),
      item('🚨', '警灯'),
      item('🛻', '皮卡'),
      item('🛺', '雪橇')
    ]
  },
  {
    id: 'daily',
    label: '生活用品',
    items: [
      item('👕', '上衣'),
      item('👖', '裤子'),
      item('👗', '裙子'),
      item('🧦', '袜子'),
      item('👟', '运动鞋'),
      item('👞', '皮鞋'),
      item('🧢', '鸭舌帽'),
      item('👒', '草帽'),
      item('🎒', '书包'),
      item('👜', '手提包'),
      item('👓', '眼镜'),
      item('🕶️', '墨镜'),
      item('🧤', '手套'),
      item('🧣', '围巾'),
      item('🪥', '牙刷'),
      item('🧼', '肥皂'),
      item('🛁', '浴缸'),
      item('🚿', '花洒'),
      item('🍽️', '餐盘'),
      item('🥄', '勺子'),
      item('🔑', '钥匙'),
      item('🔦', '手电'),
      item('💡', '台灯'),
      item('🪣', '水桶')
    ]
  }
]

export function getPictureSet(id: string): PictureSet {
  return PICTURE_SETS.find((s) => s.id === id) ?? PICTURE_SETS[0]
}