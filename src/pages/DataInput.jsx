import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { PRODUCTS, RAW_MATERIALS, REGIONS, TRANSPORT_TYPES } from '../utils/data'

export default function DataInput() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: null,
    rawMaterial: null,
    rawMaterialAmount: '',
    electricity: '',
    electricityRegion: null,
    transport: null,
    transportDistance: '',
    transportWeight: '',
  })

  useEffect(() => {
    // Устанавливаем регион из профиля пользователя, если есть
    if (user?.company?.region) {
      const userRegion = REGIONS.find((r) => r.id === user.company.region)
      if (userRegion) {
        setFormData((prev) => ({ ...prev, electricityRegion: userRegion }))
      }
    }

    // Загружаем сохранённые данные из localStorage
    const saved = localStorage.getItem('ecobalance_calculation')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Восстанавливаем объекты из ID
        if (parsed.product) {
          const product = PRODUCTS.find((p) => p.id === parsed.product.id)
          if (product) parsed.product = product
        }
        if (parsed.rawMaterial) {
          const material = RAW_MATERIALS.find((m) => m.id === parsed.rawMaterial.id)
          if (material) parsed.rawMaterial = material
        }
        if (parsed.electricityRegion) {
          const region = REGIONS.find((r) => r.id === parsed.electricityRegion.id)
          if (region) parsed.electricityRegion = region
        }
        if (parsed.transport) {
          const transport = TRANSPORT_TYPES.find((t) => t.id === parsed.transport.id)
          if (transport) parsed.transport = transport
        }
        setFormData((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Ошибка загрузки данных:', e)
      }
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelect = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const saveData = () => {
    localStorage.setItem('ecobalance_calculation', JSON.stringify(formData))
  }

  const nextStep = () => {
    saveData()
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCalculate = () => {
    saveData()
    navigate('/results')
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.product !== null
      case 2:
        return formData.rawMaterial !== null && formData.rawMaterialAmount && formData.electricity && formData.electricityRegion
      case 3:
        // Транспорт опционален
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const hasCompleteProfile = user?.company?.name && user?.company?.industry && user?.company?.region

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Расчёт углеродного следа</h1>
          <p className="text-gray-600">Введите данные о вашем продукте и процессе производства</p>
        </div>

        {!hasCompleteProfile && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-medium mb-1">Рекомендуется заполнить профиль компании</p>
            <p className="text-sm">
              Для более точного расчёта заполните данные о компании в{' '}
              <button
                onClick={() => navigate('/profile')}
                className="underline font-medium"
              >
                профиле
              </button>
              .
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Продукт</span>
            <span>Сырьё и энергия</span>
            <span>Транспорт</span>
            <span>Подтверждение</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="card min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Шаг 1: Выбор продукта</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Выберите продукт <span className="text-red-500">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {PRODUCTS.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect('product', product)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.product?.id === product.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Базовый след: {product.defaultFootprint} кг CO₂/т
                      </div>
                    </button>
                  ))}
                </div>
                {formData.product && (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Выбран:</strong> {formData.product.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Базовый углеродный след: {formData.product.defaultFootprint} кг CO₂/т
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Шаг 2: Сырьё и энергия (Scope 1-2)</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Основное сырьё <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field"
                  value={formData.rawMaterial?.id || ''}
                  onChange={(e) => {
                    const material = RAW_MATERIALS.find((m) => m.id === e.target.value)
                    handleSelect('rawMaterial', material)
                  }}
                >
                  <option value="">Выберите сырьё</option>
                  {RAW_MATERIALS.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} (коэффициент: {material.emissionFactor} кг CO₂/ГДж)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Расход сырья (тонн на 1 т продукта) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="rawMaterialAmount"
                  className="input-field"
                  placeholder="Например: 1.2"
                  value={formData.rawMaterialAmount}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Расход электроэнергии (МВт·ч/т) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="electricity"
                  className="input-field"
                  placeholder="Например: 0.5"
                  value={formData.electricity}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регион энергосистемы <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field"
                  value={formData.electricityRegion?.id || ''}
                  onChange={(e) => {
                    const region = REGIONS.find((r) => r.id === e.target.value)
                    handleSelect('electricityRegion', region)
                  }}
                >
                  <option value="">Выберите регион</option>
                  {REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} (коэффициент: {region.emissionFactor} кг CO₂/кВт·ч)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Используется для автоматического расчёта углеродного коэффициента
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Шаг 3: Транспорт (Scope 3, опционально)</h2>
              <p className="text-gray-600 text-sm mb-4">
                Заполните данные о транспортировке, если необходимо учитывать Scope 3 выбросы
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вид транспорта
                </label>
                <select
                  className="input-field"
                  value={formData.transport?.id || ''}
                  onChange={(e) => {
                    const transport = TRANSPORT_TYPES.find((t) => t.id === e.target.value)
                    handleSelect('transport', transport || null)
                  }}
                >
                  <option value="">Выберите вид транспорта (опционально)</option>
                  {TRANSPORT_TYPES.map((transport) => (
                    <option key={transport.id} value={transport.id}>
                      {transport.name} (коэффициент: {transport.emissionFactor} кг CO₂/т·км)
                    </option>
                  ))}
                </select>
              </div>

              {formData.transport && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Расстояние (км)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="transportDistance"
                      className="input-field"
                      placeholder="Например: 500"
                      value={formData.transportDistance}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Масса груза (тонн)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="transportWeight"
                      className="input-field"
                      placeholder="Например: 10"
                      value={formData.transportWeight}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Шаг 4: Проверка и подтверждение</h2>
              <p className="text-gray-600 mb-6">Проверьте введённые данные перед расчётом</p>

              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Продукт</h3>
                  <p className="text-gray-700">{formData.product?.name || 'Не выбран'}</p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Сырьё и энергия</h3>
                  <div className="space-y-1 text-gray-700">
                    <p><strong>Сырьё:</strong> {formData.rawMaterial?.name || 'Не указано'}</p>
                    <p><strong>Расход сырья:</strong> {formData.rawMaterialAmount || 'Не указано'} т/т</p>
                    <p><strong>Электроэнергия:</strong> {formData.electricity || 'Не указано'} МВт·ч/т</p>
                    <p><strong>Регион:</strong> {formData.electricityRegion?.name || 'Не указан'}</p>
                  </div>
                </div>

                {formData.transport && formData.transportDistance && formData.transportWeight && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Транспорт</h3>
                    <div className="space-y-1 text-gray-700">
                      <p><strong>Вид:</strong> {formData.transport.name}</p>
                      <p><strong>Расстояние:</strong> {formData.transportDistance} км</p>
                      <p><strong>Масса:</strong> {formData.transportWeight} т</p>
                    </div>
                  </div>
                )}

                {!formData.transport && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Транспорт</h3>
                    <p className="text-gray-500 italic">Не указан (опционально)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalculate}
              disabled={!isStepValid()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Рассчитать
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
