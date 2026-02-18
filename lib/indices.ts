// Daftar saham berdasarkan indeks IHSG
// Data per Februari 2025 — update secara manual jika ada perubahan konstituen

export const IDX30: string[] = [
    'ADRO', 'AMMN', 'ANTM', 'ASII', 'BBCA', 'BBNI', 'BBRI', 'BBTN', 'BMRI', 'BRMS',
    'BUKA', 'CPIN', 'EMTK', 'EXCL', 'FTSE', 'GOTO', 'HRUM', 'ICBP', 'INCO', 'INDF',
    'INKP', 'INTP', 'ITMG', 'JSMR', 'KLBF', 'MAPI', 'MBMA', 'MDKA', 'MEDC', 'MIKA',
];

export const LQ45: string[] = [
    'ADRO', 'AMRT', 'AMMN', 'ANTM', 'ARTO', 'ASII', 'ASRM', 'AUTO', 'BBCA', 'BBNI',
    'BBRI', 'BBTN', 'BMRI', 'BRMS', 'BUKA', 'CLEO', 'CPIN', 'EMTK', 'EXCL', 'GOTO',
    'HRUM', 'ICBP', 'INCO', 'INDF', 'INKP', 'INTP', 'ITMG', 'JSMR', 'KLBF', 'MAPA',
    'MAPI', 'MBMA', 'MDKA', 'MEDC', 'MIKA', 'MLPL', 'PGEO', 'PNLF', 'PTBA', 'SMGR',
    'TINS', 'TLKM', 'TOWR', 'UNTR', 'UNVR',
];

export const IDX80: string[] = [
    'ADRO', 'AGRO', 'AKRA', 'AMRT', 'AMMN', 'ANTM', 'ARTO', 'ASII', 'AUTO', 'BBCA',
    'BBNI', 'BBRI', 'BBTN', 'BIMA', 'BJBR', 'BJTM', 'BMRI', 'BRMS', 'BSDE', 'BUKA',
    'CLEO', 'CMRY', 'CPIN', 'DSSA', 'EMTK', 'ERAA', 'ESSA', 'EXCL', 'FREN', 'GGRM',
    'GOTO', 'HRUM', 'ICBP', 'INCO', 'INDF', 'INKP', 'INTP', 'ISAT', 'ITMG', 'JPFA',
    'JSMR', 'KLBF', 'LPPF', 'MAPA', 'MAPI', 'MBMA', 'MAPA', 'MDKA', 'MEDC', 'MIKA',
    'MLPL', 'MNCN', 'MYOR', 'NISSAN', 'PGAS', 'PGEO', 'PNLF', 'PTBA', 'PTPP', 'PWON',
    'SCMA', 'SIDO', 'SMGR', 'SMRA', 'SOCI', 'SSMS', 'TINS', 'TLKM', 'TOWR', 'TPIA',
    'UNTR', 'UNVR', 'WIKA', 'WSKT', 'ACES', 'ADHI', 'AGII', 'AKRA', 'BBRM', 'BUDI',
];

export const INDICES: Record<string, { label: string; stocks: string[] }> = {
    idx30: { label: 'IDX30', stocks: IDX30 },
    lq45: { label: 'LQ45', stocks: LQ45 },
    idx80: { label: 'IDX80', stocks: IDX80 },
};
