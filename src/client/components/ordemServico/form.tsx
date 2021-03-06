import {DialogActions, FormControl, Grid, InputLabel, Link, makeStyles} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import {useSnackbar} from 'notistack';
import React, {Dispatch, useContext} from 'react';
import {getAcoesOrdemServico, TipoUsoPermissoes} from '../../../commonLib';
import {formataDataStringLocal} from '../../../commonLib/formatacao';
import {
    IEntregavelOrdemServico,
    IEtapaOrdemServico,
    IItemOrdemServico,
    IOrdemServico,
    ITipoOrdemServicoContrato,
} from '../../../commonLib/interface-models';
import {getStatusOrdemServico} from '../../../commonLib/interface-models/getStatusOrdemServico';
import {getTipoOrdemServico} from '../../../commonLib/interface-models/getTipoOrdemServico';
import {
    AreasRequisitantesMap,
    ContratosMap,
    FornecedoresMap,
} from '../../../commonLib/interface-models/maps-entidades-types';
import {StatusOrdemServico} from '../../../commonLib/interface-models/StatusOrdemServico';
import {ActionEntity, ActionType, AppContext, AppContextStoreType} from '../../App-Context';
import {useFormHook} from '../../customHooks/useForm';
import {useGetRespostaServico} from '../../customHooks/useGetRespostaServico';
import {EditionType, IEntidadeContexto} from '../../models/EntidadeContext';
import {postOrdemServico} from '../../services/backend';
import {getProximoDiaUtil, LocalFeriado} from '../../services/dataHora';
import useStyles from '../../services/styles';
import {CampoLista, SelectItemNulo} from '../lib/campoLista';
import {CampoTexto} from '../lib/campoTexto';
import {ConteudoDialog} from '../lib/conteudoDialog';
import {TituloDialog} from '../lib/tituloDialog';
import {Transicao} from '../lib/Transicao';
import {OrdemServicoContext} from './contextOrdemServico';
import {TabelaEntregaveisOrdensServico} from './entregavel';
import {TabelaEtapasOrdensServico} from './etapa';
import {TabelaItensOrdensServico} from './item';

const privateUseStyles = makeStyles((theme) => ({
    linkNumeroSEI: {
        marginTop: theme.spacing(3),
    },
}));

export const FormOrdemServico: React.FC<{}> = ({}) => {
    const classes = useStyles();
    const privateClasses = privateUseStyles();
    //TIP REACT:A component calling useContext will always re-render when the context value changes.
    //If re-rendering the component is expensive, you can optimize it by using memoization.
    const {state: appState, dispatch: appDispatch}: {state: AppContextStoreType; dispatch: Dispatch<any>} = useContext(
        AppContext,
    );
    const fornecedores: FornecedoresMap = appState.fornecedores;
    const contratos: ContratosMap = appState.contratos;
    const areas: AreasRequisitantesMap = appState.areasRequisigantes;
    const ordemServicoContexto: IEntidadeContexto<IOrdemServico> = useContext(OrdemServicoContext);
    const {state: osState, dispatch: osDispatch} = ordemServicoContexto;
    const statusOS = getStatusOrdemServico(osState.dado);

    const {enqueueSnackbar} = useSnackbar(); //hook do notifystack para mostrar mensagens
    const {getRespostaServico: getRespostaPostOrdemServico} = useGetRespostaServico<IOrdemServico>(postOrdemServico);

    let [errosInput, setErrosInput] = React.useState<{[atributo: string]: boolean}>({});
    const onSubmitOS = async () => {
        //Habilitação de ações
        const pode = getAcoesOrdemServico(TipoUsoPermissoes.VALIDAR_UI, osState.dado);
        const validacao = pode.salvar();
        if (validacao.ok) {
            const respostaServico = await getRespostaPostOrdemServico(osState.dado);
            if (respostaServico.sucesso) {
                appDispatch({
                    tipo: ActionType.INCLUIR,
                    entidade: ActionEntity.ORDEM_SERVICO,
                    dados: respostaServico.dados,
                });
                osDispatch({tipo: EditionType.FECHAR});
                enqueueSnackbar(`Ordem de Serviço ${osState.dado.id ? 'atualizada' : 'cadastrada'} com sucesso`, {
                    variant: 'success',
                });
            }
        } else if (validacao.mensagensAtributo) {
            errosInput = {};
            Object.keys(validacao.mensagensAtributo).forEach((atributo: string) => {
                errosInput[atributo] = true;
                const msg = (validacao.mensagensAtributo as any)[atributo];
                enqueueSnackbar(msg, {variant: 'warning'});
            });
            setErrosInput({...errosInput});
        }
    };
    const {inputs, onInputChange, addItemArray, updateItemArray, markToRemoveItemArray, onSubmit} = useFormHook<
        IOrdemServico
    >(onSubmitOS, osState.dado, ordemServicoContexto);
    const [aberto, setAberto] = React.useState(true);

    const onClickClose = () => {
        setAberto(false);
        osDispatch({tipo: EditionType.FECHAR});
    };

    /**
     * Tratamento diferenciado quando muda o contrato ou o tipo da Ordem de Serviço
     */
    const onChangeContratoOuTipoOrdemServiço = (event: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(event);
        //se mudou contrato ou o tipo da Ordem de Serviço e não há nenhum entregável que não seja
        //exatamente os carregados por esta função (auto=true), carrega os entregáveis default do tipo da OS no contrato
        // o mesmo acontece no caso das etapas da ordem de serviço
        //contrato existe

        if (contratos[osState.dado.idContrato]) {
            const tipoOS = getTipoOrdemServico(osState.dado, appState.contratos);
            //se o tipo OS foi selecionado
            if (tipoOS) {
                carregaDefaultsTipoOrdemServico(tipoOS);
            }
        }
    };

    //Habilitação de ações
    const pode = getAcoesOrdemServico(TipoUsoPermissoes.HABILITAR_UI, osState.dado);

    return (
        <div>
            <Dialog
                fullWidth
                maxWidth="md"
                scroll="body"
                open={aberto}
                onClose={onClickClose}
                TransitionComponent={Transicao}
            >
                <form className={classes.form} noValidate onSubmit={onSubmit}>
                    <TituloDialog
                        titulo={
                            inputs.numero
                                ? `Ordem de Serviço: ${String(inputs.numero).padStart(3, '0')}`
                                : 'Nova Ordem de Serviço'
                        }
                        funcaoFechar={onClickClose}
                    ></TituloDialog>
                    <ConteudoDialog dividers>
                        <Grid container>
                            {statusOS > StatusOrdemServico.RASCUNHO && (
                                <React.Fragment>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth style={{margin: 8}}>
                                            <InputLabel shrink htmlFor="linkNumeroSEI">
                                                Número Documento SEI{' '}
                                            </InputLabel>
                                            <Link
                                                className={privateClasses.linkNumeroSEI}
                                                id="linkNumeroSEI"
                                                href={osState.dado.linkOrdemServicoSEI}
                                                target="_blank"
                                            >
                                                {osState.dado.numeroDocumentoOrdemServicoSEI}
                                            </Link>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        {statusOS > StatusOrdemServico.RASCUNHO && (
                                            <CampoTexto
                                                atributo="dtEmissao"
                                                label="Data de Emissão"
                                                objetoValor={inputs}
                                                fullWidth={false}
                                                somenteLeitura={true}
                                                funcaoFormatacao={formataDataStringLocal}
                                            />
                                        )}
                                    </Grid>
                                </React.Fragment>
                            )}
                            <Grid item xs={12}>
                                <CampoLista
                                    atributo="idContrato"
                                    label="Contrato"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok || osState.dado.itens?.length > 0}
                                    obrigatorio={true}
                                    onChange={onChangeContratoOuTipoOrdemServiço}
                                    defaultValue={inputs.idContrato}
                                    opcoes={[SelectItemNulo].concat(
                                        Object.values(contratos).map((contrato) => {
                                            return {
                                                valor: contrato.id,
                                                label: String(contrato.numeroContrato)
                                                    .padStart(2, '0')
                                                    .concat(
                                                        '/',
                                                        String(contrato.anoContrato),
                                                        ' - ',
                                                        fornecedores[contrato.idFornecedor].razaoSocial,
                                                    ),
                                            };
                                        }),
                                    )}
                                    error={errosInput.idContrato}
                                    autoFocus={true}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <CampoLista
                                    atributo="idTipoOrdemServicoContrato"
                                    label="Tipo da Ordem de Serviço"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={true}
                                    onChange={onChangeContratoOuTipoOrdemServiço}
                                    defaultValue={inputs.idTipoOrdemServicoContrato}
                                    opcoes={
                                        contratos[inputs.idContrato]
                                            ? [SelectItemNulo].concat(
                                                  Object.values(contratos[inputs.idContrato].tiposOrdemServico).map(
                                                      (tipoOS) => {
                                                          return {
                                                              valor: tipoOS.id,
                                                              label: tipoOS.descricao,
                                                          };
                                                      },
                                                  ),
                                              )
                                            : [SelectItemNulo]
                                    }
                                    error={errosInput.idTipoOrdemServicoContrato}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <CampoLista
                                    atributo="emergencial"
                                    label="Criticidade"
                                    objetoValor={inputs}
                                    fullWidth={false}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={true}
                                    onChange={onInputChange}
                                    defaultValue={false}
                                    opcoes={[
                                        {valor: false, label: 'Normal'},
                                        {valor: true, label: 'Emergencial'},
                                    ]}
                                    error={errosInput.emergencial}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <CampoTexto
                                    atributo="idProjeto"
                                    label="Projeto"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={false}
                                    onChange={onInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <CampoTexto
                                    atributo="idProduto"
                                    label="Produto"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={false}
                                    onChange={onInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <CampoLista
                                    atributo="idAreaRequisitante"
                                    label="Área Requisitante"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={true}
                                    onChange={onInputChange}
                                    defaultValue={inputs.idAreaRequisitante}
                                    opcoes={[SelectItemNulo].concat(
                                        Object.values(areas).map((area) => {
                                            return {
                                                valor: area.id,
                                                label: area.siglaArea.concat(' - ', area.nomeArea),
                                            };
                                        }),
                                    )}
                                    error={errosInput.idAreaRequisitante}
                                    autoFocus={true}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <CampoTexto
                                    atributo="nomeRequisitante"
                                    label="Nome do Requisitante"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={true}
                                    onChange={onInputChange}
                                    error={errosInput.nomeRequisitante}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <CampoTexto
                                    atributo="nomeFiscalTecnico"
                                    label="Fiscal Técnico"
                                    objetoValor={inputs}
                                    fullWidth={true}
                                    somenteLeitura={!pode.editar().ok}
                                    obrigatorio={true}
                                    onChange={onInputChange}
                                    error={errosInput.nomeFiscalTecnico}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TabelaItensOrdensServico
                                    funcaoAdicionar={(item: IItemOrdemServico) => {
                                        addItemArray('itens', item);
                                    }}
                                    funcaoAtualizar={(item: IItemOrdemServico, indice: number) => {
                                        updateItemArray('itens', indice, item);
                                    }}
                                    funcaoRemover={(indice: number) => {
                                        markToRemoveItemArray('itens', indice);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TabelaEtapasOrdensServico
                                    funcaoAdicionar={(etapa: IEtapaOrdemServico) => {
                                        addItemArray('etapas', etapa);
                                    }}
                                    funcaoAtualizar={(etapa: IEtapaOrdemServico, indice: number) => {
                                        updateItemArray('etapas', indice, etapa);
                                    }}
                                    funcaoRemover={(indice: number) => {
                                        markToRemoveItemArray('etapas', indice);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TabelaEntregaveisOrdensServico
                                    funcaoAdicionar={(entregavel: IEntregavelOrdemServico) => {
                                        addItemArray('entregaveis', entregavel);
                                    }}
                                    funcaoAtualizar={(entregavel: IEntregavelOrdemServico, indice: number) => {
                                        updateItemArray('entregaveis', indice, entregavel);
                                    }}
                                    funcaoRemover={(indice: number) => {
                                        markToRemoveItemArray('entregaveis', indice);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </ConteudoDialog>
                    <DialogActions>
                        <Button type="submit" color="primary">
                            Salvar
                        </Button>
                        <Button color="primary" onClick={onClickClose}>
                            Cancelar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    );

    function carregaDefaultsTipoOrdemServico(tipoOS: ITipoOrdemServicoContrato) {
        let entregaveis = [];
        let etapas = [];
        const entidade = osState;
        let carregou = false;
        //se não existe nenhuma etapa lém das carregadas automaticamente, carrega as etapas default do tipo da OS
        if (!osState.dado.etapas || osState.dado.etapas.filter((etapa) => !etapa.hasOwnProperty('auto')).length == 0) {
            let ini: any = null;
            let fim: any = null;

            etapas = tipoOS.etapas.map((e) => {
                ini = getProximoDiaUtil(
                    ini == null && fim == null
                        ? moment()
                        : getProximoDiaUtil(fim.add(1, 'd'), LocalFeriado.RioDeJaneiro),
                );
                fim = getProximoDiaUtil(ini);
                //se for um dia de duração, a data fim é a mesma
                //por isso, começamos a interação no 1 e não no zero
                for (let i = 1; i < e.numeroDiasUteisDuracao; i++) {
                    fim.add(1, 'd');
                    fim = getProximoDiaUtil(fim, LocalFeriado.RioDeJaneiro);
                }

                return {
                    descricao: e.descricao,
                    idOrdemServico: osState.dado.id,
                    dtInicioPlanejada: ini.toDate(),
                    dtFimPlanejada: fim.toDate(),
                    auto: true,
                };
            });
            entidade.dado.etapas = etapas;
            carregou = true;
        }
        //se não existe nenhum além dos carregados automaticamente, carrega os entregáveis default do tipo da OS
        if (
            !osState.dado.entregaveis ||
            osState.dado.entregaveis.filter((entregavel) => !entregavel.hasOwnProperty('auto')).length == 0
        ) {
            entregaveis = tipoOS.entregaveis.map((e) => {
                return {
                    descricao: e.descricao,
                    ordem: e.ordem,
                    idOrdemServico: osState.dado.id,
                    auto: true,
                };
            });
            entidade.dado.entregaveis = entregaveis;
            carregou = true;
        }
        if (carregou) {
            osDispatch({
                tipo: EditionType.ATUALIZAR_CONTEXTO,
                dado: {
                    ...entidade.dado,
                },
            });
        }
    }
};
