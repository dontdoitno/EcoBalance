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

// Функция получения оценки вклада
export function getImpactRating(percentage) {
  if (percentage >= 40) return { label: 'Высокий', color: 'red' }
  if (percentage >= 20) return { label: 'Средний', color: 'yellow' }
  return { label: 'Низкий', color: 'green' }
}

// Функция генерации карты "слабых мест"
export function generateWeaknessMap(data, footprint, breakdown) {
  const map = []

  breakdown.forEach((item) => {
    if (item.name === 'Сырьё') {
      map.push({
        source: 'Сырьё (Scope 1)',
        contribution: item.percentage,
        rating: getImpactRating(item.percentage),
        scope: 'Scope 1',
      })
    } else if (item.name === 'Энергия') {
      map.push({
        source: 'Электроэнергия (Scope 2)',
        contribution: item.percentage,
        rating: getImpactRating(item.percentage),
        scope: 'Scope 2',
      })
    } else if (item.name === 'Транспорт') {
      map.push({
        source: 'Транспорт (Scope 3)',
        contribution: item.percentage,
        rating: getImpactRating(item.percentage),
        scope: 'Scope 3',
      })
    }
  })

  return map
}

// Функция генерации рекомендаций с полной информацией
export function generateRecommendations(data, footprint, breakdown) {
  const recommendations = []
  const { rawMaterial, rawMaterialAmount, electricity, electricityRegion, transport, transportDistance, transportWeight } = data

  // Рассчитываем вклад компонентов
  const rawMaterialEmission = (parseFloat(rawMaterialAmount) || 0) * (rawMaterial?.emissionFactor || 0)
  const electricityEmission = (parseFloat(electricity) || 0) * (electricityRegion?.emissionFactor || 0) * 1000
  let transportEmission = 0
  if (transport && transportDistance && transportWeight) {
    transportEmission = (transport.emissionFactor || 0) * parseFloat(transportDistance) * parseFloat(transportWeight)
  }

  const electricityPercentage = breakdown.find(b => b.name === 'Энергия')?.percentage || 0
  const rawMaterialPercentage = breakdown.find(b => b.name === 'Сырьё')?.percentage || 0
  const transportPercentage = breakdown.find(b => b.name === 'Транспорт')?.percentage || 0

  // 1. Переход на ВИЭ
  if (electricity && electricity > 0.3) {
    const reductionPercentage = Math.min(15 + electricityPercentage / 2, 25)
    const reductionAmount = Math.round((footprint * reductionPercentage) / 100)
    recommendations.push({
      id: 'renewable_energy',
      title: 'Переход на электроэнергию с низким углеродным фактором (ВИЭ-сертификаты)',
      action: 'Переход на поставщика электроэнергии с ВИЭ или покупка I-REC сертификатов',
      expectedReduction: {
        percentage: reductionPercentage,
        absolute: reductionAmount,
        unit: 'кг CO₂-экв./т',
      },
      explanation: 'Уменьшается Scope 2 — выбросы от энергосистемы. Если сейчас используется региональная сетка с высоким угольным фактором, переход на сертифицированную "зелёную" электроэнергию резко снижает интенсивность выбросов.',
      complexity: 'low',
      complexityLabel: 'Низкая',
      sideEffects: {
        esg: ['Улучшает ESG-рейтинг', 'Позволяет включить в отчёты CDP и GRI', 'Может дать конкурентное преимущество при тендерах'],
        economic: ['Потенциальная экономия на энергии при долгосрочных контрактах'],
        other: [],
      },
      payback: '1-3 года',
      certifications: ['ISO 14064', 'ISO 14067'],
      scope: 'Scope 2',
    })
  }

  // 2. Оптимизация энергопотребления
  if (electricity && electricity > 0.5) {
    const reductionPercentage = Math.min(8 + (electricityPercentage / 4), 15)
    const reductionAmount = Math.round((footprint * reductionPercentage) / 100)
    recommendations.push({
      id: 'energy_efficiency',
      title: 'Оптимизация энергопотребления оборудования',
      action: 'Модернизация компрессоров, теплообменников, электродвигателей',
      expectedReduction: {
        percentage: reductionPercentage,
        absolute: reductionAmount,
        unit: 'кг CO₂-экв./т',
      },
      explanation: 'Снижается потребление электроэнергии (Scope 2) или топлива (Scope 1). Особенно эффективно при энергоёмких химических процессах (аммиак, хлор-щелочной процесс, пиролиз).',
      complexity: electricity > 1 ? 'high' : 'medium',
      complexityLabel: electricity > 1 ? 'Высокая' : 'Средняя',
      sideEffects: {
        esg: ['Улучшение ESG-рейтинга'],
        economic: [`Экономия энергии ${Math.round(3 + (electricityPercentage / 10))}–${Math.round(8 + (electricityPercentage / 5))}% ежегодно`],
        other: ['Повышение надёжности оборудования', `Быстрая окупаемость (1-3 года)`],
      },
      payback: '1-3 года',
      certifications: ['ISO 50001'],
      scope: 'Scope 1-2',
    })
  }

  // 3. Замена сырья
  if (rawMaterial && rawMaterial.id !== 'biomass' && rawMaterialPercentage > 30) {
    let newMaterial = null
    let reductionPercentage = 0

    if (rawMaterial.id === 'naphtha') {
      newMaterial = 'пропан'
      reductionPercentage = Math.min(10 + (rawMaterialPercentage / 5), 20)
    } else if (rawMaterial.id === 'natural_gas') {
      newMaterial = 'биометан'
      reductionPercentage = Math.min(15 + (rawMaterialPercentage / 4), 30)
    } else if (rawMaterial.id === 'coal') {
      newMaterial = 'природный газ или биомасса'
      reductionPercentage = Math.min(20 + (rawMaterialPercentage / 3), 35)
    }

    if (newMaterial) {
      const reductionAmount = Math.round((footprint * reductionPercentage) / 100)
      recommendations.push({
        id: 'raw_material_replacement',
        title: 'Замена части сырья на сырьё с меньшим углеродным фактором',
        action: `Переход с "${rawMaterial.name}" на "${newMaterial}"`,
        expectedReduction: {
          percentage: reductionPercentage,
          absolute: reductionAmount,
          unit: 'кг CO₂-экв./т',
        },
        explanation: 'Снижается Scope 1, благодаря меньшему углеродному фактору сырья.',
        complexity: 'medium',
        complexityLabel: 'Средняя',
        sideEffects: {
          esg: ['Возможность заявить "частично биобазированный продукт"', 'Лучше встраивается в требования EU CBAM'],
          economic: [],
          other: ['Зависит от доступности поставщиков'],
        },
        payback: '2-5 лет',
        certifications: ['ISO 14064'],
        scope: 'Scope 1',
      })
    }
  }

  // 4. Оптимизация логистики
  if (transport && transportPercentage > 5) {
    const reductionPercentage = Math.min(2 + (transportPercentage / 2), 5)
    const reductionAmount = Math.round((footprint * reductionPercentage) / 100)
    recommendations.push({
      id: 'logistics_optimization',
      title: 'Оптимизация логистики',
      action: 'Выбор железной дороги вместо грузовиков, оптимизация загрузки транспорта, переход на морские перевозки',
      expectedReduction: {
        percentage: reductionPercentage,
        absolute: reductionAmount,
        unit: 'кг CO₂-экв./т',
      },
      explanation: 'Транспорт обычно даёт небольшой вклад, но при больших расстояниях эффект заметен: выбор железной дороги вместо грузовиков, оптимизация загрузки транспорта, переход на морские перевозки.',
      complexity: 'low',
      complexityLabel: 'Низкая',
      sideEffects: {
        esg: ['Соответствие стандартам ISO 14083'],
        economic: ['Снижение транспортных расходов'],
        other: [],
      },
      payback: 'Немедленно',
      certifications: ['ISO 14083'],
      scope: 'Scope 3',
    })
  }

  // 5. Улавливание CO₂ и CH₄
  if (rawMaterial && (rawMaterial.id === 'natural_gas' || rawMaterial.id === 'naphtha') && rawMaterialPercentage > 40) {
    const reductionPercentage = Math.min(15 + (rawMaterialPercentage / 3), 40)
    const reductionAmount = Math.round((footprint * reductionPercentage) / 100)
    recommendations.push({
      id: 'carbon_capture',
      title: 'Улавливание CO₂ и CH₄ при добыче или использовании сырья',
      action: 'Внедрение систем улавливания метана и снижения потерь парафиновых углеводородов',
      expectedReduction: {
        percentage: reductionPercentage,
        absolute: reductionAmount,
        unit: 'кг CO₂-экв./т',
      },
      explanation: 'Снижается Scope 1 благодаря уменьшению потерь парафиновых углеводородов и метана.',
      complexity: 'high',
      complexityLabel: 'Высокая',
      sideEffects: {
        esg: ['Возможность получить государственные субсидии за "карбон негатив" проекты', 'Улучшение рейтингов MSCI / S&P ESG'],
        economic: ['Требует инвестиций в оборудование'],
        other: [],
      },
      payback: '5-10 лет',
      certifications: ['ISO 14064', 'CDM'],
      scope: 'Scope 1',
    })
  }

  return recommendations
}

// Функция расчёта нового следа с учётом выбранных рекомендаций
export function calculateNewFootprint(footprint, selectedRecommendations, allRecommendations) {
  let newFootprint = footprint
  let totalReduction = 0

  selectedRecommendations.forEach((recId) => {
    const rec = allRecommendations.find((r) => r.id === recId)
    if (rec) {
      const reduction = (footprint * rec.expectedReduction.percentage) / 100
      totalReduction += reduction
    }
  })

  // Применяем снижение (но учитываем, что эффекты могут частично накладываться)
  // Используем мультипликативный подход для более реалистичного расчёта
  let multiplier = 1
  selectedRecommendations.forEach((recId) => {
    const rec = allRecommendations.find((r) => r.id === recId)
    if (rec) {
      multiplier *= (1 - rec.expectedReduction.percentage / 100)
    }
  })

  // Если выбрано несколько мер, учитываем эффект синергии (немного меньше суммарного эффекта)
  if (selectedRecommendations.length > 1) {
    const synergyFactor = 0.85 // Коэффициент синергии
    const combinedReduction = (1 - multiplier) * synergyFactor
    newFootprint = footprint * (1 - combinedReduction)
  } else {
    newFootprint = footprint * multiplier
  }

  return {
    newFootprint: Math.round(newFootprint),
    totalReduction: Math.round(footprint - newFootprint),
    totalReductionPercentage: Math.round(((footprint - newFootprint) / footprint) * 100),
  }
}
