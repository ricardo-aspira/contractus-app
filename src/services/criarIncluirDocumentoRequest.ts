import {Documento} from '.';

export const CDS = '110000072';
export function criarIncluirDocumentoRequest(documento: Documento) {
    return {
        SiglaSistema: 'contractusapp',
        IdentificacaoServico: 'cadastro_documento',
        IdUnidade: CDS,
        Documento: documento,
    };
}
