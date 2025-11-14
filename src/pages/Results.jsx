import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import Layout from '../components/Layout'
import { calculateCarbonFootprint, generateRecommendations, PRODUCTS, RAW_MATERIALS, REGIONS, TRANSPORT_TYPES } from '../utils/data'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']

export default function Results() {
  const navigate = useNavigate()
  const [calculationData, setCalculationData] = useState(null)
  const [footprint, setFootprint] = useState(0)
  const [breakdown, setBreakdown] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [benchmark, setBenchmark] = useState(0)
  const [benchmarkDiff, setBenchmarkDiff] = useState(0)

  useEffect(() => {
    // Загружаем данные расчёта
    const saved = localStorage.getItem('ecobalance_calculation')
    if (!saved) {
      navigate('/calculate')
      return
    }

    try {
      let data = JSON.parse(saved)

      // Восстанавливаем объекты из ID, если они были сохранены как объекты
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

      // Рассчитываем бенчмарк (базовый след продукта)
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

      // Генерируем рекомендации
      const recs = generateRecommendations(data, total)
      setRecommendations(recs)

      // Сохраняем результаты
      const resultsData = {
        footprint: total,
        breakdown: breakdownData,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Результаты расчёта</h1>
          <p className="text-gray-600">Анализ углеродного следа продукта</p>
        </div>

        {/* Main Result Card */}
        <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white mb-8 shadow-xl">
          <div className="text-center py-8">
            <p className="text-primary-100 mb-4">Общий углеродный след</p>
            <div className="text-6xl font-bold mb-2">{footprint}</div>
            <p className="text-xl text-primary-100">кг CO₂-экв./т продукта</p>
            <p className="mt-4 text-primary-100">Продукт: {calculationData.product?.name}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Breakdown Chart */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Вклад компонентов</h2>
            {breakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {breakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-gray-600">
                        {item.value} кг CO₂ ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет данных для отображения</p>
            )}
          </div>

          {/* Benchmark Comparison */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Сравнение с бенчмарком</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Ваш показатель</span>
                  <span className="text-2xl font-bold text-gray-900">{footprint}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700 font-medium">Средний по отрасли</span>
                  <span className="text-xl font-semibold text-gray-600">{benchmark}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full ${
                      footprint > benchmark ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((footprint / (benchmark * 1.5)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold ${
                      footprint > benchmark ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {footprint > benchmark ? '+' : ''}
                    {benchmarkDiff.toFixed(1)}%
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {footprint > benchmark
                      ? 'выше среднего по отрасли'
                      : 'ниже среднего по отрасли'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Рекомендации по снижению выбросов</h2>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className="p-4 bg-primary-50 border-l-4 border-primary-600 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-gray-700 mb-2">{rec.description}</p>
                      <span className="inline-block px-3 py-1 bg-primary-200 text-primary-800 rounded-full text-sm font-medium">
                        {rec.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Нет специфических рекомендаций. Ваши показатели в пределах нормы.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/calculate')}
            className="btn-secondary"
          >
            Пересчитать
          </button>
          <div className="space-x-4">
            <button
              onClick={() => {
                // Сохраняем результаты
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
            <button
              onClick={() => navigate('/report')}
              className="btn-primary"
            >
              Сформировать отчёт
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
