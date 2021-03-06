import {InputLabel, Paper, Table, TableBody, TableContainer} from '@material-ui/core';
import {useSnackbar} from 'notistack';
import React, {Dispatch, useContext, useEffect} from 'react';
import {getAcoesEntregavelOrdemServico, TipoUsoPermissoes} from '../../../../commonLib';
import {IEntregavelOrdemServico, IOrdemServico} from '../../../../commonLib/interface-models';
import {ContratosMap} from '../../../../commonLib/interface-models/maps-entidades-types';
import {AppContext, AppContextStoreType} from '../../../App-Context';
import {useControleEdicaoEntidadesFilhos} from '../../../customHooks/useControleEdicaoEntidadesFilhos';
import {useFormHook} from '../../../customHooks/useForm';
import {IEntidadeContexto} from '../../../models/EntidadeContext';
import useStyles from '../../../services/styles';
import {OrdemServicoContext} from '../contextOrdemServico';
import {FormEntregavelOrdemServico} from './form';
import {HeaderEntregaveisOrdensServico} from './header';
import {novoEntregavelOrdemServico} from './new';
import {RowEntregavelOrdemServico} from './row';

export const TabelaEntregaveisOrdensServico: React.FC<{
    funcaoAdicionar: (etapa: IEntregavelOrdemServico) => void;
    funcaoAtualizar: (etapa: IEntregavelOrdemServico, indice: number) => void;
    funcaoRemover: (indice: number) => void;
}> = (props) => {
    const {funcaoAdicionar, funcaoAtualizar, funcaoRemover} = props;
    const classes = useStyles();
    const {enqueueSnackbar} = useSnackbar(); //hook do notifystack para mostrar mensagens

    const refButtonAdiciona = React.useRef<HTMLInputElement>(null);

    //If re-rendering the component is expensive, you can optimize it by using memoization.
    const {state: appState, dispatch: appDispatch}: {state: AppContextStoreType; dispatch: Dispatch<any>} = useContext(
        AppContext,
    );
    const contratos: ContratosMap = appState.contratos;
    const {state: osState}: IEntidadeContexto<IOrdemServico> = useContext(OrdemServicoContext);

    //Custom Hook para controle dos elementos visuais durante a edição
    const {criar, editar, confirmar, fecharForm, remover, instancia, mostraForm} = useControleEdicaoEntidadesFilhos<
        IEntregavelOrdemServico
    >(funcaoAdicionar, funcaoAtualizar, funcaoRemover, refButtonAdiciona);
    //custom hook para controle de estado dos atributos da entidade
    let [errosInput, setErrosInput] = React.useState<{[atributo: string]: boolean}>({});
    const {inputs, updateInputs, hasChanged, onInputChange, onSubmit} = useFormHook(
        (entregavel: IEntregavelOrdemServico, indice?: number) => {
            //Habilitação de ações
            const pode = getAcoesEntregavelOrdemServico(TipoUsoPermissoes.VALIDAR_UI, entregavel, osState.dado);
            const validacao = pode.salvar();
            if (validacao.ok) {
                confirmar(entregavel);
            } else if (validacao.mensagensAtributo) {
                Object.keys(validacao.mensagensAtributo).forEach((atributo: string) => {
                    errosInput[atributo] = true;
                    const msg = (validacao.mensagensAtributo as any)[atributo];
                    enqueueSnackbar(msg, {variant: 'warning'});
                });
                setErrosInput({...errosInput});
            }
        },
        instancia,
    );

    //quando mudar a instancia em edição, é preciso atualizar a variável 'inputs',
    //que é passada para o componente do Form. Se não for feito, ficará null
    useEffect(() => {
        updateInputs(instancia);
    }, [instancia]);

    return (
        <div style={{marginLeft: 8, marginTop: 8}}>
            <InputLabel shrink>Entregáveis</InputLabel>
            <TableContainer component={Paper}>
                <Table size="small" className={classes.tableInForm}>
                    <HeaderEntregaveisOrdensServico
                        mostraForm={mostraForm}
                        funcaoAdicionar={criar.bind(null, novoEntregavelOrdemServico(osState.dado), inputs)}
                        buttonAdicionaRef={refButtonAdiciona}
                    />
                    <TableBody>
                        {osState.dado.entregaveis &&
                            osState.dado.entregaveis.map((entregavelObj, i) => {
                                const entregavel: IEntregavelOrdemServico = entregavelObj as IEntregavelOrdemServico;
                                return (
                                    <RowEntregavelOrdemServico
                                        entregavel={entregavel}
                                        key={i}
                                        funcaoEditar={editar.bind(null, entregavel, hasChanged, i)}
                                        funcaoRemover={remover.bind(null, hasChanged, i)}
                                    />
                                );
                            })}
                        {mostraForm && (
                            <FormEntregavelOrdemServico
                                entregavelEditado={inputs}
                                onInputChange={onInputChange}
                                onSubmitForm={onSubmit}
                                fechaForm={fecharForm}
                                errosInput={errosInput}
                            />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};
