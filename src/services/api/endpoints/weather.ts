/**
 * 날씨 엔드포인트.
 *
 * 서버 원본: `weather/controller/WeatherController.java` / `weather/service/response/WeatherResponse.java`
 * 서버가 Open-Meteo를 호출해 WMO 날씨 코드와 산책 적합도(`WalkCondition`)를 함께 내려줍니다.
 * 좌표를 얻는 쪽은 {@link ../../location/location.getCurrentCoordinates}입니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

/** 서버 `WalkCondition` enum */
export type WalkCondition = 'GREAT' | 'GOOD' | 'MODERATE' | 'BAD' | 'DANGER'

export interface WeatherInfo {
  temperature: number
  /** WMO 날씨 코드 */
  weatherCode: number
  weatherDescription: string
  windSpeed: number
  precipitation: number
  walkCondition: WalkCondition
  /** 기온·날씨를 반영한 안내 문구 (서버에서 조립) */
  walkMessage: string
}

export const weatherApi = {
  async getWeather(latitude: number, longitude: number): Promise<WeatherInfo> {
    const response = await apiService.get<WeatherInfo>('/api/v1/weather', {
      params: { latitude, longitude },
    })
    return unwrapApiResponse(response, 200, '날씨 정보를 불러오는 데 실패했습니다.')
  },
}

/**
 * WMO 날씨 코드를 이모지로 변환합니다.
 * 네이티브 `WeatherService.getWeatherEmoji`와 동일한 구간입니다.
 */
export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️' // 맑음
  if (code >= 1 && code <= 3) return '☁️' // 대체로 맑음 ~ 흐림
  if (code === 45 || code === 48) return '🌫️' // 안개
  if (code >= 51 && code <= 57) return '🌦️' // 이슬비
  if (code >= 61 && code <= 67) return '🌧️' // 비
  if (code >= 71 && code <= 77) return '❄️' // 눈
  if (code >= 80 && code <= 82) return '🚿' // 소나기
  if (code >= 85 && code <= 86) return '🌨️' // 눈 소나기
  if (code >= 95 && code <= 99) return '⚡' // 뇌우
  return '🌡️'
}
