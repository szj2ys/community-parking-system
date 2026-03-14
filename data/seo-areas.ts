// SEO Areas data - 20 hot areas in Beijing, Shanghai, Shenzhen, Hangzhou

export interface AreaData {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  description: string;
  keywords: string[];
  centerLatitude: number;
  centerLongitude: number;
  radius: number; // in kilometers
  priceRange: { min: number; max: number };
  transportInfo: string;
  landmarks: string[];
}

export const seoAreas: AreaData[] = [
  // Beijing - 中关村
  {
    id: "beijing-zhongguancun",
    name: "中关村",
    slug: "zhongguancun",
    city: "北京",
    province: "北京市",
    description: "中关村是北京著名的科技园区，周边写字楼密集，停车位紧张。这里汇聚了众多高校、科研院所和科技公司，是北京的中国硅谷。社区车位租赁平台为您提供中关村周边小区的闲置车位，解决科技从业者的停车难题。",
    keywords: ["中关村车位", "中关村停车", "海淀车位租赁", "中关村附近车位", "中关村共享车位"],
    centerLatitude: 39.9845,
    centerLongitude: 116.315,
    radius: 2,
    priceRange: { min: 8, max: 25 },
    transportInfo: "地铁4号线中关村站、10号线海淀黄庄站，多条公交线路经过",
    landmarks: ["中关村广场", "海龙大厦", "鼎好电子城", "北京大学", "清华大学"],
  },
  // Beijing - 国贸
  {
    id: "beijing-guomao",
    name: "国贸",
    slug: "guomao",
    city: "北京",
    province: "北京市",
    description: "国贸是北京CBD核心区域，云集了众多跨国公司和金融机构。商务区停车位需求旺盛，工作日停车位一位难求。通过社区车位租赁平台，您可以租用周边住宅小区的白天空闲车位，享受便捷停车体验。",
    keywords: ["国贸车位", "CBD停车", "朝阳区车位租赁", "国贸附近车位", "北京CBD共享车位"],
    centerLatitude: 39.9078,
    centerLongitude: 116.4575,
    radius: 2,
    priceRange: { min: 10, max: 30 },
    transportInfo: "地铁1号线、10号线国贸站，地铁6号线东大桥站",
    landmarks: ["国贸三期", "中国尊", "央视大楼", "银泰中心", "建国门"],
  },
  // Beijing - 望京
  {
    id: "beijing-wangjing",
    name: "望京",
    slug: "wangjing",
    city: "北京",
    province: "北京市",
    description: "望京是北京著名的国际社区，也是重要的商业和居住区域。这里居住着大量外籍人士和互联网从业者，停车需求量大。社区车位租赁为望京居民提供便捷的车位共享服务，让车位资源得到充分利用。",
    keywords: ["望京车位", "望京停车", "朝阳区车位出租", "望京soho停车", "望京共享车位"],
    centerLatitude: 39.9975,
    centerLongitude: 116.48,
    radius: 3,
    priceRange: { min: 6, max: 20 },
    transportInfo: "地铁14号线、15号线望京站，地铁14号线阜通站",
    landmarks: ["望京SOHO", "望京国际商业中心", "凯德MALL", "798艺术区", "望京公园"],
  },
  // Beijing - 西二旗
  {
    id: "beijing-xierqi",
    name: "西二旗",
    slug: "xierqi",
    city: "北京",
    province: "北京市",
    description: "西二旗是北京互联网行业聚集地，被称为中国硅谷。这里汇聚了百度、小米、快手等知名科技公司，每天有数万人通勤。社区车位租赁平台为西二旗的上班族提供便捷的停车解决方案。",
    keywords: ["西二旗车位", "西二旗停车", "海淀车位租赁", "后厂村停车", "西二旗共享车位"],
    centerLatitude: 40.053,
    centerLongitude: 116.303,
    radius: 2.5,
    priceRange: { min: 5, max: 18 },
    transportInfo: "地铁13号线西二旗站、龙泽站，昌平线西二旗站",
    landmarks: ["百度大厦", "小米科技园", "快手总部", "中关村软件园", "上地"],
  },
  // Beijing - 五道口
  {
    id: "beijing-wudaokou",
    name: "五道口",
    slug: "wudaokou",
    city: "北京",
    province: "北京市",
    description: "五道口是北京著名的宇宙中心，周边高校林立，有清华大学、北京大学、北京语言大学等。这里是学术氛围浓厚的区域，也是年轻人聚集的地方。社区车位租赁为您提供五道口周边的车位资源。",
    keywords: ["五道口车位", "五道口停车", "清华附近车位", "北大附近停车", "五道口共享车位"],
    centerLatitude: 39.992,
    centerLongitude: 116.337,
    radius: 2,
    priceRange: { min: 6, max: 20 },
    transportInfo: "地铁13号线五道口站，地铁15号线清华东路西口站",
    landmarks: ["清华科技园", "五道口购物中心", "语言大学", "地质大学", "东升大厦"],
  },
  // Beijing - 三里屯
  {
    id: "beijing-sanlitun",
    name: "三里屯",
    slug: "sanlitun",
    city: "北京",
    province: "北京市",
    description: "三里屯是北京著名的时尚商圈和夜生活聚集地，拥有众多酒吧、餐厅和购物中心。这里是北京最国际化的区域之一，周末和节假日人流密集，停车需求旺盛。",
    keywords: ["三里屯车位", "三里屯停车", "工体附近车位", "朝阳区车位租赁", "三里屯共享车位"],
    centerLatitude: 39.936,
    centerLongitude: 116.455,
    radius: 2,
    priceRange: { min: 10, max: 35 },
    transportInfo: "地铁10号线团结湖站，地铁2号线、10号线朝阳门站",
    landmarks: ["三里屯太古里", "工人体育场", "三里屯SOHO", "通盈中心", "世贸百货"],
  },
  // Beijing - 金融街
  {
    id: "beijing-jinrongjie",
    name: "金融街",
    slug: "jinrongjie",
    city: "北京",
    province: "北京市",
    description: "金融街是北京最重要的金融中心，聚集了中国人民银行、中国证监会等重要金融机构。这里是商务精英的聚集地，工作日停车位极其紧张。社区车位租赁为金融从业者提供专属停车服务。",
    keywords: ["金融街车位", "金融街停车", "西城区车位租赁", "复兴门停车", "金融街共享车位"],
    centerLatitude: 39.915,
    centerLongitude: 116.358,
    radius: 1.5,
    priceRange: { min: 12, max: 40 },
    transportInfo: "地铁1号线、2号线复兴门站，地铁2号线阜成门站",
    landmarks: ["金融街购物中心", "中国证监会", "中国人民银行", "北京银行", "金交所"],
  },
  // Shanghai - 陆家嘴
  {
    id: "shanghai-lujiazui",
    name: "陆家嘴",
    slug: "lujiazui",
    city: "上海",
    province: "上海市",
    description: "陆家嘴是上海的金融中心，也是中国最重要的金融区之一。这里矗立着东方明珠、上海中心、环球金融中心等标志性建筑。陆家嘴工作日停车需求巨大，社区车位租赁为您提供周边住宅区的空闲车位。",
    keywords: ["陆家嘴车位", "陆家嘴停车", "浦东车位租赁", "金融中心停车", "陆家嘴共享车位"],
    centerLatitude: 31.2375,
    centerLongitude: 121.503,
    radius: 2,
    priceRange: { min: 12, max: 40 },
    transportInfo: "地铁2号线、14号线陆家嘴站，地铁4号线浦东大道站",
    landmarks: ["东方明珠", "上海中心大厦", "环球金融中心", "金茂大厦", "正大广场"],
  },
  // Shanghai - 张江
  {
    id: "shanghai-zhangjiang",
    name: "张江",
    slug: "zhangjiang",
    city: "上海",
    province: "上海市",
    description: "张江高科技园区是上海科技创新的核心区域，汇聚了众多国内外知名高科技企业。这里是上海的硅谷，每天都有大量科技从业者在此工作。社区车位租赁平台为张江科技园区提供便捷的停车服务。",
    keywords: ["张江车位", "张江停车", "浦东车位租赁", "张江高科停车", "张江共享车位"],
    centerLatitude: 31.203,
    centerLongitude: 121.602,
    radius: 3,
    priceRange: { min: 8, max: 25 },
    transportInfo: "地铁2号线张江高科站、金科路站，地铁13号线张江路站",
    landmarks: ["张江药谷", "张江人工智能岛", "上海光源", "张江微电子港", "张江集电港"],
  },
  // Shanghai - 徐家汇
  {
    id: "shanghai-xujiahui",
    name: "徐家汇",
    slug: "xujiahui",
    city: "上海",
    province: "上海市",
    description: "徐家汇是上海著名的商业中心，也是重要的交通枢纽。这里汇集了港汇恒隆、美罗城等大型购物中心，是上海西部最繁华的区域。周末购物停车需求旺盛，社区车位租赁为您解决停车难题。",
    keywords: ["徐家汇车位", "徐家汇停车", "徐汇车位租赁", "港汇停车", "徐家汇共享车位"],
    centerLatitude: 31.195,
    centerLongitude: 121.437,
    radius: 2,
    priceRange: { min: 10, max: 30 },
    transportInfo: "地铁1号线、9号线、11号线徐家汇站",
    landmarks: ["港汇恒隆广场", "美罗城", "徐家汇天主教堂", "交大", "光启城"],
  },
  // Shanghai - 人民广场
  {
    id: "shanghai-renminguangchang",
    name: "人民广场",
    slug: "renminguangchang",
    city: "上海",
    province: "上海市",
    description: "人民广场是上海市中心，也是上海的政治、文化和商业中心。这里拥有上海博物馆、上海大剧院等重要文化设施，也是南京路步行街的起点。市中心停车位稀缺，社区车位租赁为您提供便利。",
    keywords: ["人民广场车位", "人民广场停车", "黄浦区车位租赁", "南京路停车", "人民广场共享车位"],
    centerLatitude: 31.232,
    centerLongitude: 121.475,
    radius: 2,
    priceRange: { min: 15, max: 50 },
    transportInfo: "地铁1号线、2号线、8号线人民广场站",
    landmarks: ["上海博物馆", "上海大剧院", "南京路步行街", "新世界城", "来福士广场"],
  },
  // Shanghai - 虹桥
  {
    id: "shanghai-hongqiao",
    name: "虹桥",
    slug: "hongqiao",
    city: "上海",
    province: "上海市",
    description: "虹桥是上海重要的交通枢纽，拥有虹桥机场和虹桥火车站。虹桥商务区是上海新兴的商业中心，吸引了众多企业入驻。社区车位租赁为虹桥区域的商务人士和旅客提供停车便利。",
    keywords: ["虹桥车位", "虹桥停车", "闵行区车位租赁", "虹桥商务区停车", "虹桥共享车位"],
    centerLatitude: 31.197,
    centerLongitude: 121.324,
    radius: 3,
    priceRange: { min: 8, max: 28 },
    transportInfo: "地铁2号线、10号线虹桥火车站，地铁2号线虹桥2号航站楼站",
    landmarks: ["虹桥机场", "虹桥火车站", "虹桥天地", "龙湖天街", "国家会展中心"],
  },
  // Shanghai - 静安寺
  {
    id: "shanghai-jingansi",
    name: "静安寺",
    slug: "jingansi",
    city: "上海",
    province: "上海市",
    description: "静安寺是上海著名的商业区和高档住宅区，拥有众多购物中心、写字楼和酒店。这里是上海最繁华的商圈之一，南京西路沿线商业发达。社区车位租赁为静安区的商务人士提供优质车位。",
    keywords: ["静安寺车位", "静安停车", "静安区车位租赁", "南京西路停车", "静安共享车位"],
    centerLatitude: 31.223,
    centerLongitude: 121.447,
    radius: 2,
    priceRange: { min: 12, max: 45 },
    transportInfo: "地铁2号线、7号线静安寺站，地铁14号线静安寺站",
    landmarks: ["静安寺", "静安嘉里中心", "恒隆广场", "久光百货", "梅龙镇广场"],
  },
  // Shenzhen - 科技园
  {
    id: "shenzhen-kejiyuan",
    name: "科技园",
    slug: "kejiyuan",
    city: "深圳",
    province: "广东省",
    description: "深圳科技园是中国科技创新的重要基地，汇聚了腾讯、大疆、中兴等知名科技企业。这里是深圳科技产业的引擎，每天都有数万科技人才在此工作。社区车位租赁为科技园员工解决停车烦恼。",
    keywords: ["科技园车位", "科技园停车", "南山区车位租赁", "深圳湾停车", "科技园共享车位"],
    centerLatitude: 22.543,
    centerLongitude: 113.953,
    radius: 2.5,
    priceRange: { min: 8, max: 25 },
    transportInfo: "地铁1号线高新园站、深大站，地铁2号线科苑站",
    landmarks: ["腾讯大厦", "大疆总部", "中兴大厦", "深圳湾科技生态园", "虚拟大学园"],
  },
  // Shenzhen - 福田CBD
  {
    id: "shenzhen-futian-cbd",
    name: "福田CBD",
    slug: "futian-cbd",
    city: "深圳",
    province: "广东省",
    description: "福田CBD是深圳的中央商务区，是深圳金融和商务的核心区域。这里汇集了深圳证券交易所、平安金融中心等重要金融机构。社区车位租赁为福田CBD的商务精英提供优质车位资源。",
    keywords: ["福田车位", "福田CBD停车", "福田区车位租赁", "会展中心停车", "福田共享车位"],
    centerLatitude: 22.541,
    centerLongitude: 114.059,
    radius: 2,
    priceRange: { min: 10, max: 35 },
    transportInfo: "地铁1号线、4号线会展中心站，地铁2号线、4号线市民中心站",
    landmarks: ["平安金融中心", "深交所", "会展中心", "购物公园", "皇庭广场"],
  },
  // Shenzhen - 南山中心区
  {
    id: "shenzhen-nanshan-zhongxin",
    name: "南山中心区",
    slug: "nanshan-zhongxin",
    city: "深圳",
    province: "广东省",
    description: "南山中心区是深圳南山区的重要商业和居住区，拥有海岸城、南山书城等知名地标。这里是深圳年轻人喜爱的聚集地，商业发达，生活便利。社区车位租赁为南山区居民和访客提供停车服务。",
    keywords: ["南山车位", "南山中心区停车", "南山区车位租赁", "海岸城停车", "南山共享车位"],
    centerLatitude: 22.517,
    centerLongitude: 113.935,
    radius: 2,
    priceRange: { min: 8, max: 28 },
    transportInfo: "地铁2号线、11号线后海站，地铁2号线登良站、海月站",
    landmarks: ["海岸城", "南山书城", "保利剧院", "深圳湾体育中心", "人才公园"],
  },
  // Hangzhou - 未来科技城
  {
    id: "hangzhou-weilaikejicheng",
    name: "未来科技城",
    slug: "weilaikejicheng",
    city: "杭州",
    province: "浙江省",
    description: "杭州未来科技城是浙江省重点打造的科技创新高地，汇聚了阿里巴巴、字节跳动等互联网巨头。这里是杭州数字经济发展的重要引擎，吸引了大量互联网人才。社区车位租赁为科技城员工提供停车便利。",
    keywords: ["未来科技城车位", "未来科技城停车", "余杭区车位租赁", "阿里附近车位", "科技城共享车位"],
    centerLatitude: 30.276,
    centerLongitude: 119.992,
    radius: 3,
    priceRange: { min: 6, max: 20 },
    transportInfo: "地铁5号线、19号线创景路站，地铁5号线良睦路站",
    landmarks: ["阿里巴巴西溪园区", "字节跳动", "钉钉总部", "梦想小镇", "杭师大仓前校区"],
  },
  // Hangzhou - 钱江新城
  {
    id: "hangzhou-qianjiangxincheng",
    name: "钱江新城",
    slug: "qianjiangxincheng",
    city: "杭州",
    province: "浙江省",
    description: "钱江新城是杭州新的城市中心，是杭州金融、商务和文化的核心区。这里拥有杭州大剧院、城市阳台等地标建筑，也是杭州最现代化的区域。社区车位租赁为钱江新城的商务人士提供优质车位。",
    keywords: ["钱江新城车位", "钱江新城停车", "上城区车位租赁", "市民中心停车", "钱江新城共享车位"],
    centerLatitude: 30.247,
    centerLongitude: 120.215,
    radius: 2,
    priceRange: { min: 8, max: 30 },
    transportInfo: "地铁1号线、4号线近江站、城星路站，地铁7号线市民中心站",
    landmarks: ["杭州大剧院", "城市阳台", "万象城", "来福士中心", "市民中心"],
  },
  // Hangzhou - 西湖景区
  {
    id: "hangzhou-xihu",
    name: "西湖景区",
    slug: "xihu",
    city: "杭州",
    province: "浙江省",
    description: "西湖是杭州最著名的景点，也是世界文化遗产。西湖周边停车一直是难题，尤其是在旅游旺季。社区车位租赁平台整合西湖周边小区的车位资源，为游客和市民提供便捷的停车选择。",
    keywords: ["西湖停车", "西湖车位", "景区车位租赁", "湖滨停车", "西湖共享车位"],
    centerLatitude: 30.245,
    centerLongitude: 120.145,
    radius: 3,
    priceRange: { min: 10, max: 40 },
    transportInfo: "地铁1号线龙翔桥站、凤起路站，地铁2号线凤起路站",
    landmarks: ["断桥残雪", "雷峰塔", "苏堤", "白堤", "音乐喷泉"],
  },
  // Hangzhou - 滨江
  {
    id: "hangzhou-binjiang",
    name: "滨江",
    slug: "binjiang",
    city: "杭州",
    province: "浙江省",
    description: "滨江是杭州高新区所在地，是杭州数字经济的重要载体。这里汇聚了网易、海康威视等知名科技企业，也是杭州年轻人聚集的区域。社区车位租赁为滨江区的科技从业者提供停车服务。",
    keywords: ["滨江车位", "滨江停车", "滨江区车位租赁", "网易附近车位", "滨江共享车位"],
    centerLatitude: 30.208,
    centerLongitude: 120.215,
    radius: 3,
    priceRange: { min: 6, max: 22 },
    transportInfo: "地铁1号线、6号线江陵路站，地铁4号线联庄站、中医药大学站",
    landmarks: ["网易", "海康威视", "滨江宝龙城", "星光大道", "钱塘江大桥"],
  },
  // Hangzhou - 武林广场
  {
    id: "hangzhou-wulin",
    name: "武林广场",
    slug: "wulin",
    city: "杭州",
    province: "浙江省",
    description: "武林广场是杭州传统的商业中心，也是杭州最繁华的区域之一。这里汇集了杭州大厦、银泰百货等知名商场，是杭州购物和休闲的首选地。社区车位租赁为来武林商圈的消费者提供停车便利。",
    keywords: ["武林广场车位", "武林停车", "拱墅区车位租赁", "杭州大厦停车", "武林共享车位"],
    centerLatitude: 30.274,
    centerLongitude: 120.165,
    radius: 2,
    priceRange: { min: 8, max: 28 },
    transportInfo: "地铁1号线、3号线武林广场站，地铁2号线、3号线武林门站",
    landmarks: ["杭州大厦", "武林银泰", "国大城市广场", "西湖文化广场", "环球中心"],
  },
];

/**
 * Get area by slug
 */
export function getAreaBySlug(slug: string): AreaData | undefined {
  return seoAreas.find((area) => area.slug === slug);
}

/**
 * Get areas by city
 */
export function getAreasByCity(city: string): AreaData[] {
  return seoAreas.filter((area) => area.city === city);
}

/**
 * Get all area slugs
 */
export function getAllAreaSlugs(): string[] {
  return seoAreas.map((area) => area.slug);
}

/**
 * Get areas within bounding box (for filtering spots)
 */
export function getAreasInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): AreaData[] {
  return seoAreas.filter(
    (area) =>
      area.centerLatitude >= minLat &&
      area.centerLatitude <= maxLat &&
      area.centerLongitude >= minLng &&
      area.centerLongitude <= maxLng
  );
}

/**
 * Calculate distance between two coordinates in km
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest area to coordinates
 */
export function findNearestArea(
  latitude: number,
  longitude: number
): { area: AreaData; distance: number } | null {
  let nearest: { area: AreaData; distance: number } | null = null;

  for (const area of seoAreas) {
    const distance = calculateDistance(
      latitude,
      longitude,
      area.centerLatitude,
      area.centerLongitude
    );

    if (!nearest || distance < nearest.distance) {
      nearest = { area, distance };
    }
  }

  return nearest;
}
