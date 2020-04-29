import {OrdemServicoFull} from '../../../models';

export function novaOrdemServico(): OrdemServicoFull {
    return ({
        idContrato: -1,
        emergencial: false,
        idTipoOrdemServicoContrato: -1,
        nomeRequisitante: '',
        nomeFiscalTecnico: '',
        itens: [],
        entregaveis: [],
        etapas: [],
    } as unknown) as OrdemServicoFull;
}