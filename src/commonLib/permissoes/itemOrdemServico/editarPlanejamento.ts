import {IItemOrdemServico, IOrdemServico, StatusOrdemServico} from '../../interface-models';
import {getStatusOrdemServico} from '../../interface-models/getStatusOrdemServico';
import {ConstrutorRetornoPermissoes} from '../construirRetorno';
import {RetornoPermisao} from '../RetornoPermisao';
import {TipoUsoPermissoes} from '../TipoUsoPermissoes';

export function editarPlanejamento(
    c: ConstrutorRetornoPermissoes,
    item: IItemOrdemServico,
    ordemServico: IOrdemServico,
): RetornoPermisao {
    /* ############### ORDEM DE SERVIÇO TEM QUE ESTAR EM RASCUNHO AINDA ######*/
    let r = c.construir(
        getStatusOrdemServico(ordemServico) == StatusOrdemServico.RASCUNHO,
        'quantidadeEstimada',
        `Dados de planejamento do serviço não podem ser modificados após emissão da Ordem de Serviço`,
    );
    //Se o uso for HABILITAR_UI, retorna sem acumular mensagens ou qualquer outra validação/processamento
    if (r.ok == false && c.tipoUso == TipoUsoPermissoes.HABILITAR_UI) return r;

    return r;
}
