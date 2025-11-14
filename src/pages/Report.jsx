import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import jsPDF from 'jspdf'

// Динамический импорт html2canvas только при необходимости
let html2canvas
if (typeof window !== 'undefined') {
  import('html2canvas').then((module) => {
    html2canvas = module.default
  })
}

export default function Report() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ecobalance_results')
    if (!saved) {
      navigate('/results')
      return
    }

    try {
      setResults(JSON.parse(saved))
    } catch (e) {
      console.error('Ошибка загрузки результатов:', e)
      navigate('/results')
    }
  }, [navigate])

  const getStatusColor = () => {
    if (!results) return 'gray'
    if (results.footprint > results.benchmark * 1.2) return 'red'
    if (results.footprint < results.benchmark * 0.9) return 'green'
    return 'yellow'
  }

  const getStatusText = () => {
    if (!results) return 'Не определен'
    if (results.footprint > results.benchmark * 1.2) return 'Высокий'
    if (results.footprint < results.benchmark * 0.9) return 'Низкий'
    return 'Средний'
  }

  const getStatusEmoji = () => {
    const status = getStatusColor()
    if (status === 'green') return '🟢'
    if (status === 'yellow') return '🟡'
    return '🔴'
  }

  const getSummaryText = () => {
    if (!results) return ''
    if (results.footprint > results.benchmark * 1.2) {
      return 'Уровень выбросов вашей компании выше среднего. Основной вклад — потребление энергии. Рекомендуется анализ энергоэффективности оборудования.'
    }
    if (results.footprint < results.benchmark * 0.9) {
      return 'Уровень выбросов вашей компании ниже среднего. Продолжайте работать над оптимизацией процессов для дальнейшего снижения.'
    }
    return 'Уровень выбросов вашей компании находится в пределах средних показателей отрасли. Есть потенциал для оптимизации.'
  }

  const downloadPDF = async () => {
    setLoading(true)
    try {
      // Убеждаемся, что html2canvas загружен
      if (!html2canvas && typeof window !== 'undefined') {
        const module = await import('html2canvas')
        html2canvas = module.default
      }

      if (!html2canvas) {
        throw new Error('html2canvas не загружен')
      }

      const element = document.getElementById('report-content')
      if (!element) {
        throw new Error('Элемент отчёта не найден')
      }

      // Показываем элемент для захвата
      element.style.display = 'block'

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      })

      // Скрываем элемент обратно
      element.style.display = 'none'

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`ecobalance-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Ошибка генерации PDF:', error)
      alert('Ошибка при создании PDF. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent('Отчёт EcoBalance - Расчёт углеродного следа')
    const body = encodeURIComponent(
      `Отчёт о расчёте углеродного следа продукта.\n\n` +
        `Продукт: ${results?.data?.product?.name || 'Не указан'}\n` +
        `Углеродный след: ${results?.footprint || 0} кг CO₂-экв./т\n\n` +
        `Сгенерировано системой EcoBalance`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (!results) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Отчёт и вывод результата</h1>
          <p className="text-gray-600">Итоговый отчёт по расчёту углеродного следа</p>
        </div>

        {/* Status Card */}
        <div className="card mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ваш углеродный след рассчитан</h2>
          <div className="mb-6">
            <div className="text-6xl mb-4">{getStatusEmoji()}</div>
            <div
              className={`inline-block px-6 py-3 rounded-lg text-xl font-bold mb-4 ${
                getStatusColor() === 'green'
                  ? 'bg-green-100 text-green-800'
                  : getStatusColor() === 'yellow'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {getStatusText()} ({getStatusText() === 'Высокий' ? '> 20% от среднего' : getStatusText() === 'Низкий' ? '< среднеотраслевого' : 'Средний'})
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">{getSummaryText()}</p>
        </div>

        {/* Report Content for PDF */}
        <div id="report-content" className="bg-white p-8 mb-8" style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">EcoBalance</h1>
              <p className="text-xl text-gray-600">Отчёт о расчёте углеродного следа</p>
            </div>

            <div className="border-t-2 border-b-2 border-gray-300 py-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Информация о компании</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Компания:</strong> {user?.company?.name || 'Не указана'}</p>
                <p><strong>Отрасль:</strong> {user?.company?.industry || 'Не указана'}</p>
                <p><strong>Размер:</strong> {user?.company?.size || 'Не указан'}</p>
                <p><strong>Регион:</strong> {user?.company?.region || 'Не указан'}</p>
              </div>
            </div>

            <div className="border-b-2 border-gray-300 py-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Информация о продукте</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Продукт:</strong> {results.data.product?.name || 'Не указан'}</p>
                <p><strong>Сырьё:</strong> {results.data.rawMaterial?.name || 'Не указано'}</p>
                <p><strong>Расход сырья:</strong> {results.data.rawMaterialAmount || 'Не указано'} т/т</p>
                <p><strong>Электроэнергия:</strong> {results.data.electricity || 'Не указано'} МВт·ч/т</p>
              </div>
            </div>

            <div className="border-b-2 border-gray-300 py-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Результаты расчёта</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Общий углеродный след (Scope 1-3)</p>
                <p className="text-4xl font-bold text-gray-900">{results.footprint}</p>
                <p className="text-lg text-gray-600">кг CO₂-экв./т продукта</p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Вклад компонентов:</h3>
                <ul className="space-y-1">
                  {results.breakdown.map((item, index) => (
                    <li key={item.name} className="text-gray-700">
                      {item.name}: {item.value} кг CO₂ ({item.percentage}%)
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Сравнение с бенчмарком</p>
                <p className="text-lg font-semibold text-gray-900">
                  Ваш показатель: {results.footprint} кг CO₂/т
                </p>
                <p className="text-lg text-gray-700">
                  Средний по отрасли: {results.benchmark} кг CO₂/т
                </p>
                <p className={`text-lg font-bold ${results.footprint > results.benchmark ? 'text-red-600' : 'text-green-600'}`}>
                  {results.footprint > results.benchmark ? '+' : ''}
                  {results.benchmarkDiff.toFixed(1)}% от среднего
                </p>
              </div>
            </div>

            {results.recommendations.length > 0 && (
              <div className="border-b-2 border-gray-300 py-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Рекомендации по снижению выбросов</h2>
                <ul className="space-y-4">
                  {results.recommendations.map((rec) => (
                    <li key={rec.id} className="border-l-4 border-primary-600 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-gray-700 mb-1">{rec.description}</p>
                      <p className="text-sm text-primary-600 font-medium">{rec.impact}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 pt-8 border-t-2 border-gray-300">
              <p>Дата формирования: {new Date().toLocaleDateString('ru-RU')}</p>
              <p>Версия методики: 1.0</p>
              <p className="mt-2 font-medium">Сгенерировано системой EcoBalance</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={downloadPDF}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Генерация PDF...' : 'Скачать PDF'}
          </button>
          <button
            onClick={sendEmail}
            className="btn-secondary"
          >
            Отправить по email
          </button>
          <button
            onClick={() => navigate('/calculate')}
            className="btn-secondary"
          >
            Сравнить с другим продуктом
          </button>
        </div>

        {/* Web Version Preview */}
        <div className="card bg-gray-50">
          <h2 className="text-2xl font-semibold mb-6">Веб-версия отчёта</h2>
          <div className="bg-white p-6 rounded-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{getStatusEmoji()}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ваш углеродный след рассчитан</h3>
            </div>
            <div className="mb-6">
              <div
                className={`inline-block px-6 py-3 rounded-lg text-xl font-bold ${
                  getStatusColor() === 'green'
                    ? 'bg-green-100 text-green-800'
                    : getStatusColor() === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {getStatusText()}
              </div>
              <p className="mt-4 text-gray-700">{getSummaryText()}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Общий след</p>
                <p className="text-2xl font-bold">{results.footprint} кг CO₂/т</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Бенчмарк</p>
                <p className="text-2xl font-bold">{results.benchmark} кг CO₂/т</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Отклонение</p>
                <p className={`text-2xl font-bold ${results.footprint > results.benchmark ? 'text-red-600' : 'text-green-600'}`}>
                  {results.footprint > results.benchmark ? '+' : ''}
                  {results.benchmarkDiff.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
