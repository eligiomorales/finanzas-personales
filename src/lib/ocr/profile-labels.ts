export type ImageProfile = 'wallbit-debit'

export function imageProfileLabel(profile: ImageProfile): string {
  switch (profile) {
    case 'wallbit-debit':
      return 'Wallbit (captura)'
  }
}
