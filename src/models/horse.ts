interface IHorseData {
  id: number
  name: string
  color: string
  condition: number
}

export type TRaceHorse = Readonly<IHorseData>

export interface IHorse extends IHorseData {
  colorName: string
}

export type THorseMotion = 'still' | 'galloping' | 'frozen'

export interface IHorsePoolGroup {
  label: string
  entries: readonly { horse: IHorse; lane?: number; position?: number }[]
}
