export interface MonthlyReportHeader {
    Identificador?: string;
    Fecha_documento: string;
    Fecha_contable: string;
    Ejercicio: string;
    Periodo: string;
    Sociedad: string;
    Clase_documento: string;
    Referencia: string;
    Texto_cabecera: string;
    Fecha_IVA: string;
}

export interface CustomerPosition {
    Posicion: string;
    Cuenta_cliente: string;
    Cuenta: string;
    Importe: string;
    Moneda: string;
    Num_Asignacion: string;
    Texto_explicativo: string;
    Centro_beneficio: string;
}

export interface IncomePosition {
    Posicion: string;
    Cuenta_ingreso: string;
    Importe: string;
    Moneda: string;
    Indicador_IVA: string;
    Centro_beneficio: string;
    Elemento_PEP: string;
    Num_asignacion: string;
    Texto_explicativo: string;
}

export interface TaxPosition {
    Posicion: string;
    Cuenta_impuestos: string;
    Importe: string;
    Moneda: string;
    Indicador_IVA: string;
    Num_asignacion: string;
    Texto_explicativo: string;
    Centro_beneficio: string;
    Base_Imponible_IVA: string;
}

export interface MonthlyReport {
    Factura: {
        Cabecera: MonthlyReportHeader;
        Posicion_cliente: CustomerPosition;
        Posicion_ingreso: IncomePosition[];
        Posicion_impuestos: TaxPosition[];
    };
}