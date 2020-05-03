import {IconButton, Tooltip} from '@material-ui/core';
import React, {Dispatch, useContext} from 'react';
import {getStatusOrdemServico} from '../../../models/getStatusOrdemServico';
import {StatusOrdemServico} from '../../../models/StatusOrdemServico';
import {AppContext, AppContextStoreType} from '../../App-Context';
import {ContratosMap, OrdensServicoMap} from '../../models/TypeContext';
import {TypeOrdemServico_Void} from '../../models/TypeFunctions';
import {encurtaNome, formataDataStringLocal} from '../../services/formatacao';
import {DeleteIcon, SearchIcon} from '../lib/icons';
import {Tabela, TabelaColunaDado} from '../lib/tabela';

export const TabelaOrdensServico: React.FC<{
    idContratoSelecionado: number;
    funcaoVisualizar: TypeOrdemServico_Void;
    funcaoExcluir: TypeOrdemServico_Void;
}> = ({idContratoSelecionado, funcaoVisualizar, funcaoExcluir}) => {
    //Buscando dados
    //TIP REACT: A component calling useContext will always re-render when the context value changes.
    //If re-rendering the component is expensive, you can optimize it by using memoization.
    const {
        state: appState,
    }: {
        state: AppContextStoreType;
        dispatch: Dispatch<any>;
    } = useContext(AppContext);
    const contratos: ContratosMap = appState.contratos;
    const ordens: OrdensServicoMap = appState.ordensServico;
    const ordensContrato = Object.values(ordens).filter((o) => o.idContrato == idContratoSelecionado);

    function getTipoOrdemServico(idTipoOrdemServicoContrato: number) {
        return contratos[idContratoSelecionado]
            ? contratos[idContratoSelecionado].tiposOrdemServico.filter(
                  (tos) => tos.id == idTipoOrdemServicoContrato,
              )[0].descricao
            : [];
    }
    function formataNumeroOS(numero: number) {
        return numero ? String(numero).padStart(3, '0') : '-';
    }

    const colunas: TabelaColunaDado[] = [];
    colunas.push({
        atributo: 'numero',
        titulo: '#',
        funcaoFormatacao: formataNumeroOS,
    });
    colunas.push({
        atributo: 'idTipoOrdemServicoContrato',
        titulo: 'Tipo',
        funcaoFormatacao: getTipoOrdemServico,
    });
    colunas.push({
        atributo: 'dtEmissao',
        titulo: 'Emissão',
        funcaoFormatacao: formataDataStringLocal,
    });
    colunas.push({atributo: 'idProduto', titulo: 'Produto'});
    colunas.push({
        atributo: 'nomeRequisitante',
        titulo: 'Fiscal Requisitante',
        funcaoFormatacao: encurtaNome,
    });
    colunas.push({
        atributo: 'nomeFiscalTecnico',
        titulo: 'Fiscal Técnico',
        funcaoFormatacao: encurtaNome,
    });

    return (
        <Tabela
            colunas={colunas}
            dados={ordensContrato}
            colunasAcao={ordensContrato.map((oc) => {
                const statusOrdemServico = getStatusOrdemServico(oc);
                return (
                    <React.Fragment>
                        <Tooltip title="Visualizar">
                            <IconButton aria-label="Visualizar" color="primary" size="small">
                                <SearchIcon fontSize="small" onClick={funcaoVisualizar.bind(null, oc)} />
                            </IconButton>
                        </Tooltip>
                        {statusOrdemServico == StatusOrdemServico.RASCUNHO && (
                            <Tooltip title="Excluir">
                                <IconButton aria-label="Excluir" color="primary" size="small">
                                    <DeleteIcon fontSize="small" onClick={funcaoExcluir.bind(null, oc)} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </React.Fragment>
                );
            })}
        />
    );
};
