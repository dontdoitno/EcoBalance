import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { INDUSTRIES, COMPANY_SIZES, REGIONS } from '../utils/data'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.company?.name || '',
    industry: user?.company?.industry || '',
    size: user?.company?.size || '',
    region: user?.company?.region || '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.company) {
      setFormData({
        name: user.company.name || '',
        industry: user.company.industry || '',
        size: user.company.size || '',
        region: user.company.region || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfile(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Профиль компании</h1>
          <p className="text-gray-600">Управляйте данными о вашей компании</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Основная информация</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Название компании <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ООО «Пример»"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Отрасль <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  required
                  className="input-field"
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="">Выберите отрасль</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                  Размер предприятия <span className="text-red-500">*</span>
                </label>
                <select
                  id="size"
                  name="size"
                  required
                  className="input-field"
                  value={formData.size}
                  onChange={handleChange}
                >
                  <option value="">Выберите размер</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  Регион <span className="text-red-500">*</span>
                </label>
                <select
                  id="region"
                  name="region"
                  required
                  className="input-field"
                  value={formData.region}
                  onChange={handleChange}
                >
                  <option value="">Выберите регион</option>
                  {REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Используется для автоматического определения коэффициентов энергосистемы
                </p>
              </div>
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Профиль успешно сохранён
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Сохранить профиль
            </button>
          </div>
        </form>

        <div className="mt-8 card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Готовы начать расчёт?</h3>
          <p className="text-gray-600 mb-4">
            После заполнения профиля вы можете перейти к расчёту углеродного следа ваших продуктов.
          </p>
          <button
            onClick={() => navigate('/calculate')}
            disabled={!formData.name || !formData.industry || !formData.size || !formData.region}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Перейти к расчёту
          </button>
        </div>
      </div>
    </Layout>
  )
}
