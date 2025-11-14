import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import {
  calculateCarbonFootprint,
  generateRecommendations,
  generateWeaknessMap,
  calculateNewFootprint,
  PRODUCTS,
  RAW_MATERIALS,
  REGIONS,
  TRANSPORT_TYPES,
} from '../utils/data'

export default function Results() {
  const navigate = useNavigate()
  const [calculationData, setCalculationData] = useState(null)
  const [footprint, setFootprint] = useState(0)
  const [breakdown, setBreakdown] = useState([])
  const [weaknessMap, setWeaknessMap] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [benchmark, setBenchmark] = useState(0)
  const [benchmarkDiff, setBenchmarkDiff] = useState(0)
  const [selectedRecommendations, setSelectedRecommendations] = useState([])
  const [newFootprintData, setNewFootprintData] = useState(null)

  useEffect(() => {
    // Загружаем данные расчёта
    const saved = localStorage.getItem('ecobalance_calculation')
    if (!saved) {
      navigate('/calculate')
      return
    }

    try {
      let data = JSON.parse(saved)

      // Восстанавливаем объекты из ID
      if (data.product && typeof data.product === 'object' && !data.product.defaultFootprint) {
        const product = PRODUCTS.find((p) => p.id === data.product?.id)
        if (product) data.product = product
      }
      if (data.rawMaterial && typeof data.rawMaterial === 'object' && !data.rawMaterial.emissionFactor) {
        const material = RAW_MATERIALS.find((m) => m.id === data.rawMaterial?.id)
        if (material) data.rawMaterial = material
      }
      if (data.electricityRegion && typeof data.electricityRegion === 'object' && !data.electricityRegion.emissionFactor) {
        const region = REGIONS.find((r) => r.id === data.electricityRegion?.id)
        if (region) data.electricityRegion = region
      }
      if (data.transport && typeof data.transport === 'object' && !data.transport.emissionFactor) {
        const transport = TRANSPORT_TYPES.find((t) => t.id === data.transport?.id)
        if (transport) data.transport = transport
      }

      setCalculationData(data)

      // Рассчитываем углеродный след
      const total = calculateCarbonFootprint(data)
      setFootprint(total)

      // Рассчитываем бенчмарк
      const baseBenchmark = data.product?.defaultFootprint || 2000
      setBenchmark(baseBenchmark)
      const diff = ((total - baseBenchmark) / baseBenchmark) * 100
      setBenchmarkDiff(diff)

      // Рассчитываем вклад компонентов
      const rawMaterialEmission = (parseFloat(data.rawMaterialAmount) || 0) * (data.rawMaterial?.emissionFactor || 0)
      const electricityEmission = (parseFloat(data.electricity) || 0) * (data.electricityRegion?.emissionFactor || 0) * 1000
      let transportEmission = 0
      if (data.transport && data.transportDistance && data.transportWeight) {
        transportEmission = (data.transport.emissionFactor || 0) * parseFloat(data.transportDistance) * parseFloat(data.transportWeight)
      }

      const breakdownData = []
      if (rawMaterialEmission > 0) {
        breakdownData.push({
          name: 'Сырьё',
          value: Math.round(rawMaterialEmission),
          percentage: Math.round((rawMaterialEmission / total) * 100),
        })
      }
      if (electricityEmission > 0) {
        breakdownData.push({
          name: 'Энергия',
          value: Math.round(electricityEmission),
          percentage: Math.round((electricityEmission / total) * 100),
        })
      }
      if (transportEmission > 0) {
        breakdownData.push({
          name: 'Транспорт',
          value: Math.round(transportEmission),
          percentage: Math.round((transportEmission / total) * 100),
        })
      }
      setBreakdown(breakdownData)

      // Генерируем карту слабых мест
      const map = generateWeaknessMap(data, total, breakdownData)
      setWeaknessMap(map)

      // Генерируем рекомендации
      const recs = generateRecommendations(data, total, breakdownData)
      setRecommendations(recs)

      // Сохраняем результаты
      const resultsData = {
        footprint: total,
        breakdown: breakdownData,
        weaknessMap: map,
        recommendations: recs,
        benchmark: baseBenchmark,
        benchmarkDiff: diff,
        data,
      }
      localStorage.setItem('ecobalance_results', JSON.stringify(resultsData))
    } catch (e) {
      console.error('Ошибка расчёта:', e)
      navigate('/calculate')
    }
  }, [navigate])

  useEffect(() => {
    if (selectedRecommendations.length > 0 && recommendations.length > 0) {
      const result = calculateNewFootprint(footprint, selectedRecommendations, recommendations)
      setNewFootprintData(result)
    } else {
      setNewFootprintData(null)
    }
  }, [selectedRecommendations, footprint, recommendations])

  const handleRecommendationToggle = (recId) => {
    setSelectedRecommendations((prev) => {
      if (prev.includes(recId)) {
        return prev.filter((id) => id !== recId)
      } else {
        return [...prev, recId]
      }
    })
  }

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!calculationData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Загрузка...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Результаты расчёта и рекомендации</h1>
          <p className="text-gray-600 text-lg">Анализ углеродного следа продукта и пути оптимизации</p>
        </div>

        {/* Main Result Card */}
        <div className="card bg-gradient-to-br from-primary-600 via-emerald-600 to-teal-600 text-white mb-12 shadow-2xl">
          <div className="text-center py-10">
            <p className="text-primary-100 mb-4 text-lg">Общий углеродный след</p>
            <div className="text-7xl font-bold mb-2">{footprint}</div>
            <p className="text-xl text-primary-100 mb-4">кг CO₂-экв./т продукта</p>
            <p className="text-primary-100 text-lg">Продукт: {calculationData.product?.name}</p>
          </div>
        </div>

        {/* Block 1: Weakness Map */}
        <div className="card mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Карта «слабых мест»</h2>
          <p className="text-gray-600 mb-8">Анализ вклада отдельных категорий в углеродный след</p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Источник выбросов
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Вклад
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Оценка
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weaknessMap.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.source}</div>
                      <div className="text-xs text-gray-500">{item.scope}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                          <div
                            className={`h-3 rounded-full ${
                              item.rating.color === 'red'
                                ? 'bg-red-500'
                                : item.rating.color === 'yellow'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${item.contribution}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.contribution}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          item.rating.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : item.rating.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.rating.emoji} {item.rating.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Block 2: Detailed Recommendations */}
        <div className="card mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Конкретные рекомендации</h2>
          <p className="text-gray-600 mb-8">
            Выберите меры для моделирования эффекта снижения углеродного следа
          </p>

          {recommendations.length > 0 ? (
            <div className="space-y-8">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className={`border-2 rounded-2xl p-6 transition-all ${
                    selectedRecommendations.includes(rec.id)
                      ? 'border-primary-500 bg-primary-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-primary-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          id={`rec-${rec.id}`}
                          checked={selectedRecommendations.includes(rec.id)}
                          onChange={() => handleRecommendationToggle(rec.id)}
                          className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <label htmlFor={`rec-${rec.id}`} className="text-xl font-bold text-gray-900 cursor-pointer">
                          {rec.title}
                        </label>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{rec.action}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    {/* Ожидаемое снижение */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                      <div className="text-sm text-emerald-700 font-semibold mb-2">Ожидаемое снижение</div>
                      <div className="text-2xl font-bold text-emerald-700 mb-1">
                        -{rec.expectedReduction.percentage.toFixed(1)}% CO₂-экв.
                      </div>
                      <div className="text-sm text-emerald-600">
                        (минус {rec.expectedReduction.absolute} {rec.expectedReduction.unit})
                      </div>
                    </div>

                    {/* Сложность */}
                    <div className={`rounded-xl p-4 border ${getComplexityColor(rec.complexity)}`}>
                      <div className="text-sm font-semibold mb-2">Сложность внедрения</div>
                      <div className="text-xl font-bold">{rec.complexityLabel}</div>
                      <div className="text-xs mt-1">Окупаемость: {rec.payback}</div>
                    </div>
                  </div>

                  {/* Обоснование */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-2">Как это работает:</div>
                    <p className="text-blue-800 leading-relaxed">{rec.explanation}</p>
                  </div>

                  {/* Побочные эффекты */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {rec.sideEffects.esg.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-sm font-semibold text-green-900 mb-2">ESG-эффект</div>
                        <ul className="space-y-1">
                          {rec.sideEffects.esg.map((effect, idx) => (
                            <li key={idx} className="text-xs text-green-800 flex items-start">
                              <span className="mr-1">✔</span>
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.sideEffects.economic.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="text-sm font-semibold text-purple-900 mb-2">Экономический эффект</div>
                        <ul className="space-y-1">
                          {rec.sideEffects.economic.map((effect, idx) => (
                            <li key={idx} className="text-xs text-purple-800 flex items-start">
                              <span className="mr-1">•</span>
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.sideEffects.other.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Дополнительно</div>
                        <ul className="space-y-1">
                          {rec.sideEffects.other.map((effect, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start">
                              <span className="mr-1">ℹ</span>
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Сертификации */}
                  {rec.certifications.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {rec.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Нет специфических рекомендаций. Ваши показатели в пределах нормы.
            </p>
          )}
        </div>

        {/* Block 3: Simulator */}
        {recommendations.length > 0 && (
          <div className="card mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Прогнозирование эффекта</h2>
            <p className="text-gray-600 mb-8">
              Отметьте выбранные меры и посмотрите, как изменится ваш углеродный след
            </p>

            {selectedRecommendations.length > 0 && newFootprintData ? (
              <div className="space-y-6">
                {/* Comparison Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      {
                        name: 'Текущий след',
                        'кг CO₂-экв./т': footprint,
                      },
                      {
                        name: 'После оптимизации',
                        'кг CO₂-экв./т': newFootprintData.newFootprint,
                      },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="кг CO₂-экв./т" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Selected Measures Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Мера
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Эффект
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Новый след
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedRecommendations.map((recId, idx) => {
                        const rec = recommendations.find((r) => r.id === recId)
                        if (!rec) return null

                        // Рассчитываем промежуточный след
                        let cumulativeFootprint = footprint
                        selectedRecommendations.slice(0, idx + 1).forEach((id) => {
                          const r = recommendations.find((rec) => rec.id === id)
                          if (r) {
                            cumulativeFootprint *= 1 - r.expectedReduction.percentage / 100
                          }
                        })

                        return (
                          <tr key={recId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{rec.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-emerald-600">
                                -{rec.expectedReduction.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {Math.round(cumulativeFootprint)} кг CO₂/т
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="bg-primary-50 font-bold">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Итого суммарно:</td>
                        <td className="px-6 py-4 whitespace-nowrap text-emerald-600">
                          -{newFootprintData.totalReductionPercentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {newFootprintData.newFootprint} кг CO₂/т
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-2">Отметьте рекомендации выше, чтобы увидеть прогноз</p>
                <p className="text-sm text-gray-500">Выберите одну или несколько мер для моделирования</p>
              </div>
            )}
          </div>
        )}

        {/* Block 4: Economic and ESG Effect */}
        {selectedRecommendations.length > 0 && (
          <div className="card mb-12 bg-gradient-to-br from-primary-50 to-emerald-50 border-primary-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Экономический и ESG-эффект</h2>
            <p className="text-gray-600 mb-6">Что даст компании внедрение выбранных мер:</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ESG-эффекты
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600">✓</span>
                    <span>Повышение ESG-рейтинга (BCG методология)</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600">✓</span>
                    <span>Снижение платежей по CBAM</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600">✓</span>
                    <span>Выполнение требований крупных покупателей (Unilever, Henkel, BASF)</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600">✓</span>
                    <span>Улучшение репутации компании</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600">✓</span>
                    <span>Попадание в зелёную зону отраслевого бенчмарка</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Экономические эффекты
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-emerald-600">•</span>
                    <span>Потенциальная экономия на энергии</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-emerald-600">•</span>
                    <span>Снижение транспортных расходов</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-emerald-600">•</span>
                    <span>Снижение рисков по углеродным налогам</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-emerald-600">•</span>
                    <span>Возможность получить государственные субсидии</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <span className="mr-2 text-emerald-600">•</span>
                    <span>Конкурентное преимущество при тендерах</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Влияние на сертификации</h3>
              <div className="flex flex-wrap gap-3">
                {[...new Set(selectedRecommendations.flatMap((recId) => {
                  const rec = recommendations.find((r) => r.id === recId)
                  return rec?.certifications || []
                }))].map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary-100 text-primary-800 rounded-lg text-sm font-semibold"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Block 5: Final Scenario */}
        {selectedRecommendations.length > 0 && newFootprintData && (
          <div className="card bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl mb-12">
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-6">Итоговый сценарий</h2>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <p className="text-lg mb-4 leading-relaxed">
                  Ваш углеродный след можно снизить с{' '}
                  <span className="font-bold text-2xl">{footprint}</span> до{' '}
                  <span className="font-bold text-2xl">{newFootprintData.newFootprint}</span>{' '}
                  кг CO₂-экв./т
                </p>
                <div className="text-3xl font-bold mb-2">
                  ({newFootprintData.totalReductionPercentage > 0 ? '-' : '+'}
                  {newFootprintData.totalReductionPercentage}%)
                </div>
                <p className="text-emerald-100 mb-4">
                  Абсолютное снижение: минус {newFootprintData.totalReduction} кг CO₂-экв./т
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-emerald-100 mb-2">ESG-рейтинг</div>
                  <div className="text-2xl font-bold">↑ Повышение</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-emerald-100 mb-2">Бенчмарк</div>
                  <div className="text-2xl font-bold">Зелёная зона</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-emerald-100 mb-2">Углеродные налоги</div>
                  <div className="text-2xl font-bold">↓ Снижение рисков</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={() => navigate('/calculate')} className="btn-secondary w-full sm:w-auto">
            Пересчитать
          </button>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                const saved = localStorage.getItem('ecobalance_results')
                if (saved) {
                  localStorage.setItem('ecobalance_saved', saved)
                }
                alert('Результаты сохранены')
              }}
              className="btn-secondary"
            >
              Сохранить результаты
            </button>
            <button onClick={() => navigate('/report')} className="btn-primary">
              Сформировать отчёт
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
