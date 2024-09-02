import itertools
import pandas as pd

def main():

    """Definindo um dicionário para mapear os tipos de dados"""
    origin_column_types = {
        'tp_entrada': 'category',                 # Tipo de entrada (1. Caso Novo, 2. Recidiva, 3. Reingresso após Abandono, 4. Não Sabe, 5. Transferência, 6. Pós-óbito)
        'tp_pop_liberdade': 'category',           # População privada de liberdade (1. Sim, 2. Não, 9. Ignorado)
        'tp_pop_rua': 'category',                 # População em situação de rua (1. Sim,2. Não, 9. Ignorado)
        'tp_forma': 'category',                   # Forma clínica da tuberculose (1. Pulmonar, 2. Extrapulmonar, 3. Pulmonar + Extrapulmonar)    
        'tp_situacao_encerramento': 'category',   # Situação de encerramento (1. Cura, 2. Abandono, 3. Óbito por TB, 4. Óbito por outras causas, 5. Transferência, 6. Mudança de Diagnóstico, 7. TB-DR, 8. Mudança de Esquema)
        'co_uf_residencia_atual': 'string',       # UF de residência atual
        'co_municipio_residencia_atual': 'string' # Município de residência atual
    }

    """Lista de colunas que devem ser interpretadas como datas"""
    origin_date_columns = [
        'dt_nascimento',         # Data de nascimento
        'dt_diagnostico_sintoma' # Data de diagnóstico dos sintomas
    ]

    final_columns = [
        'municipio',
        'mes',
        'quantidade',
        'dt_diagnostico_sintoma'
    ]

    municip_columns = [
        'dmun_codibge',
        'dmun_uf_nome',
        'dmun_municipio'
    ]

    tp_entrance = [
        '2',
        '3',
        '4',
        '5'
    ]

    tp_clinic = [
        '1',
        '3'
    ]

    months_names = {
        'January': 'Janeiro', 'February': 'Fevereiro', 'March': 'Março',
        'April': 'Abril', 'May': 'Maio', 'June': 'Junho',
        'July': 'Julho', 'August': 'Agosto', 'September': 'Setembro',
        'October': 'Outubro', 'November': 'Novembro', 'December': 'Dezembro'
    }
    
    def translate_month_name(mes_ano):
        try:
            mes, ano = mes_ano.split(' de ')
            return months_names[mes] + ' de ' + ano
        except (ValueError, KeyError) as e:
            print(f"Erro ao processar '{mes_ano}': {e}")
            return mes_ano

    data_atual = pd.Timestamp.now()

    """============ DF ORIGEM ============"""
    """Lendo o arquivo CSV Origem"""
    df_origin = pd.read_csv('origem.csv',
        sep=',',
        dtype=origin_column_types,
        parse_dates=origin_date_columns)
    
    """Converter as chaves do dicionário para uma lista e concatenar com origin_date_columns"""
    columns_to_keep = list(origin_column_types.keys()) + origin_date_columns

    """Filtrar as colunas para serem as mesmas do origin_column_types"""
    df_origin = df_origin[columns_to_keep]

    """Filtrar para se enquadrar no quadro de Casos Novos"""
    df_origin = df_origin.loc[
        ~df_origin['tp_entrada'].isin(tp_entrance) &
        df_origin['tp_forma'].isin(tp_clinic) &
        (df_origin['tp_situacao_encerramento'] != '8')
    ]

    """Limpar dados que não possuem referência do município"""
    df_origin = df_origin.dropna(subset='co_municipio_residencia_atual')

    """Tratar campos de data"""
    df_origin['dt_nascimento'] = pd.to_datetime(df_origin['dt_nascimento'], format='%Y-%m-%d', errors='coerce')
    df_origin['dt_diagnostico_sintoma'] = pd.to_datetime(df_origin['dt_diagnostico_sintoma'], format='%Y-%m-%d', errors='coerce')

    df_origin = df_origin.loc[df_origin['dt_diagnostico_sintoma'].dt.year>=2021]

    df_origin['dt_diagnostico_sintoma'] = df_origin['dt_diagnostico_sintoma'].dt.strftime('%d/%m/%Y')

    """Garantir que a coluna 'co_municipio_residencia_atual' está em formato string"""
    df_origin['co_municipio_residencia_atual'] = df_origin['co_municipio_residencia_atual'].astype(str)

    df_origin['co_municipio_residencia_atual'] = df_origin['co_municipio_residencia_atual'].astype('int64')

    """============= MUNICIPIO ============="""

    """Lendo o arquivo CSV de Municípios"""
    df_munip = pd.read_csv('dimensoes/d_municipio.csv',
        sep=',',
        usecols=municip_columns)

    """Excluindo a linha com index 0"""
    df_munip = df_munip.drop(index=0)

    """Garantir que a coluna 'dmun_codibge' está em formato int64"""
    df_munip['dmun_codibge'] = df_munip['dmun_codibge'].astype('int64')

    """Realizar o merge para puxar informações dos municipios"""
    df_munip_filtered = df_origin.merge(df_munip[['dmun_codibge','dmun_uf_nome', 'dmun_municipio']], 
                                left_on='co_municipio_residencia_atual', 
                                right_on='dmun_codibge', 
                                how='inner')

    """Filtrar dados de Goiás"""
    df_munip_filtered = df_munip_filtered.loc[df_munip_filtered['dmun_uf_nome']=='Goiás']
    df_munip_filtered.rename(columns={'dmun_municipio': 'municipio', 'dmun_uf_nome': 'uf_nome'}, inplace=True)

    """============= TEMPO ============="""

    """Lendo o arquivo CSV de Tempo"""
    df_time = pd.read_csv('dimensoes/d_tempo.csv',
        sep=',',
        usecols=['month_name','date_medium','year4'])
    
    df_time.rename(columns={'year4': 'ano'}, inplace=True)
    df_time['ano'] = df_time['ano'].astype('int64').astype(str)

    df_time['date_medium'] = pd.to_datetime(df_time['date_medium'], format='%d/%m/%Y')
    df_time['date_medium'] = df_time['date_medium'].dt.strftime('%d/%m/%Y')

    """Realizar o merge para puxar informações de tempo"""
    df_time_filtered = df_munip_filtered.merge(df_time[['month_name','date_medium','ano']], 
                                left_on='dt_diagnostico_sintoma', 
                                right_on='date_medium', 
                                how='inner')

    df_time_filtered['mes'] = df_time_filtered['month_name'] + ' de ' + df_time_filtered['ano']

    """============= CONTAGEM DE CASOS NOVOS POR MÊS E MUNICÍPIO ============="""

    month_count = df_time_filtered.groupby(['municipio', 'mes']).size().reset_index(name='quantidade')

    df_final = df_time_filtered.merge(month_count[['municipio', 'mes', 'quantidade']],
                          on=['municipio', 'mes'],
                          how='left')
    
    """Inserindo municípios que não possuem casos novos"""
    munip_list = df_final["municipio"].drop_duplicates().tolist()
    df_munip = df_munip.loc[df_munip['dmun_uf_nome']=='Goiás']
    df_munip = df_munip[['dmun_municipio']].rename(columns={'dmun_municipio': 'municipio'})
    df_munip = df_munip.loc[~df_munip['municipio'].isin(munip_list)]

    df_final = pd.concat([df_final, df_munip], ignore_index=True)
    df_final['quantidade'] = df_final['quantidade'].fillna(0).astype('int64')
    df_final = df_final.loc[df_final['municipio'] != 'Município ignorado - GO']

    df_final = df_final[final_columns]
    df_final = df_final.sort_values(by='dt_diagnostico_sintoma')
    df_final = df_final.drop(columns=['dt_diagnostico_sintoma']).drop_duplicates()

    """Inserindo dados para todos os períodos, mesmo que municipios não possuam registros"""
    municip = df_final['municipio'].unique()
    periods = pd.date_range(start='2021-01-01', end=data_atual, freq='MS').strftime("%B de %Y")
    periods = [translate_month_name(mes_ano) for mes_ano in periods]

    combinacoes = pd.DataFrame(list(itertools.product(municip, periods)), columns=['municipio', 'mes'])

    df_final = pd.merge(combinacoes, df_final, on=['municipio', 'mes'], how='left')
    df_final['quantidade'] = df_final['quantidade'].fillna(0).astype('int64')

    df_final.to_csv('saida.csv', index=False, sep=',', encoding='utf-8')
    

if __name__ == "__main__":
    main()