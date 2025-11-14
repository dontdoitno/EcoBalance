// Данные продуктов и коэффициентов
export const PRODUCTS = [
  { id: 'ammonia', name: 'Аммиак', defaultFootprint: 2400 },
  { id: 'urea', name: 'Мочевина', defaultFootprint: 1800 },
  { id: 'ethanol', name: 'Этанол', defaultFootprint: 2100 },
  { id: 'polyethylene', name: 'Полиэтилен', defaultFootprint: 1900 },
  { id: 'pvc', name: 'ПВХ', defaultFootprint: 3700 },
  { id: 'ammonium_sulfate', name: 'Сульфат аммония', defaultFootprint: 1500 },
  { id: 'acetone', name: 'Ацетон', defaultFootprint: 2200 },
]

export const RAW_MATERIALS = [
  { id: 'natural_gas', name: 'Природный газ', emissionFactor: 56.1 },
  { id: 'naphtha', name: 'Нафта', emissionFactor: 73.3 },
  { id: 'coal', name: 'Уголь', emissionFactor: 95.8 },
  { id: 'biomass', name: 'Биомасса', emissionFactor: 0 },
]

export const INDUSTRIES = [
  'Удобрения',
  'Полимеры',
  'Нефтехимия',
  'Краски и покрытия',
  'Фармацевтика',
]

export const COMPANY_SIZES = [
  { value: 'micro', label: 'Микро (до 15 человек)' },
  { value: 'small', label: 'Малое (16-100 человек)' },
  { value: 'medium', label: 'Среднее (101-250 человек)' },
  { value: 'large', label: 'Крупное (более 250 человек)' },
]

export const REGIONS = [
  { id: 'moscow', name: 'Москва и Московская область', emissionFactor: 0.35 },
  { id: 'spb', name: 'Санкт-Петербург и Ленинградская область', emissionFactor: 0.32 },
  { id: 'ural', name: 'Уральский регион', emissionFactor: 0.58 },
  { id: 'siberia', name: 'Сибирский регион', emissionFactor: 0.42 },
  { id: 'south', name: 'Южный регион', emissionFactor: 0.45 },
]

export const TRANSPORT_TYPES = [
  { id: 'truck', name: 'Автомобильный транспорт', emissionFactor: 0.162 },
  { id: 'rail', name: 'Железнодорожный транспорт', emissionFactor: 0.022 },
  { id: 'ship', name: 'Морской транспорт', emissionFactor: 0.015 },
]

// Функция расчёта углеродного следа
export function calculateCarbonFootprint(data) {
  const {
    product,
    rawMaterial,
    rawMaterialAmount,
    electricity,
    electricityRegion,
    transport,
    transportDistance,
    transportWeight,
  } = data

  let footprint = 0

  // Scope 1-2: Сырьё и энергия
  const rawMaterialEmission = (rawMaterialAmount || 0) * (rawMaterial?.emissionFactor || 0)
  const electricityEmission = (electricity || 0) * (electricityRegion?.emissionFactor || 0) * 1000 // МВт·ч в кг CO2

  footprint += rawMaterialEmission
  footprint += electricityEmission

  // Scope 3: Транспорт
  if (transport && transportDistance && transportWeight) {
    const transportEmission = (transport.emissionFactor || 0) * transportDistance * transportWeight
    footprint += transportEmission
  }

  // Если нет данных, используем базовый след продукта
  if (footprint === 0 && product) {
    footprint = product.defaultFootprint || 2000
  }

  return Math.round(footprint)
}

// Функция генерации рекомендаций
export function generateRecommendations(data, footprint) {
  const recommendations = []
  const { rawMaterial, electricity, electricityRegion, transport } = data

  if (rawMaterial && rawMaterial.id === 'natural_gas') {
    recommendations.push({
      id: 'methane_capture',
      title: 'Улавливание метана',
      description: 'Наибольший вклад — природный газ. Возможен эффект от улавливания метана и снижения потерь.',
      impact: 'Снижение до 15%',
    })
  }

  if (electricity && electricity > 0.5) {
    recommendations.push({
      id: 'renewable_energy',
      title: 'Переход на возобновляемую энергию',
      description: 'Рассмотрите переход на поставщика электроэнергии с ВИЭ для снижения Scope 2 выбросов.',
      impact: 'Снижение до 30%',
    })
  }

  if (electricity && electricity > 1) {
    recommendations.push({
      id: 'energy_efficiency',
      title: 'Повышение энергоэффективности',
      description: 'Энергоёмкость выше среднего. Проверьте эффективность компрессоров и теплообменного оборудования.',
      impact: 'Снижение до 20%',
    })
  }

  if (footprint > 2500) {
    recommendations.push({
      id: 'general_optimization',
      title: 'Комплексная оптимизация',
      description: 'Ваш углеродный след превышает средние показатели отрасли. Рекомендуется комплексный аудит процессов.',
      impact: 'Снижение до 25%',
    })
  }

  return recommendations
}
