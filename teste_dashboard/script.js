let chart;
let chart2;
let chart3;
let chart4;

function parseDate(dateString) {
    if (dateString.length !== 8) {
        console.error('Formato de data inválido:', dateString);
        return null;
    }

    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; 
    const day = parseInt(dateString.substring(6, 8), 10);

    return new Date(year, month, day);
}

function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    // Formata como 'DD/MM/YYYY' ou qualquer formato desejado
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

async function loadCSV(url) {
    const response = await fetch(url);
    const data = await response.text();

    const rows = data.split('\n'); 

    const header = rows[0].split(';'); 
    const dataRows = rows.slice(1);

    const processedData = dataRows.map(row => {
        const cols = row.split(';'); 

        if (cols.length !== header.length) {
            console.error('Linha com número inesperado de colunas:', row);
            return null; 
        }

        return {
            data_cadastro: cols[0] ? formatDate(parseDate(cols[0].trim())) : null, 
            codigo_ibge: cols[1] ? parseInt(cols[1].trim()) : null,
            municipio: cols[2] ? cols[2].trim() : '',
            regiao: cols[3] ? cols[3].trim() : '',
            macrorregiao: cols[4] ? cols[4].trim() : '',
            sexo: cols[5] ? cols[5].trim() : '',
            tempo_morador_de_rua: cols[6] ? cols[6].trim() : '',
            faixa_etaria: cols[7] ? cols[7].trim() : '',
            raca_cor: cols[8] ? cols[8].trim() : '',
            frequencia_alimentacao: cols[9] ? cols[9].trim() : '',
            acesso_higiene: cols[10] ? cols[10].trim() : '',
            fumante: cols[11] ? cols[11].trim() : '',
            uso_alcool: cols[12] ? cols[12].trim() : '',
            outras_drogas: cols[13] ? cols[13].trim() : '',
            gestante: cols[14] ? cols[14].trim() : '',
            internacao_ult_12meses: cols[15] ? cols[15].trim() : '',
            prob_saude_mental: cols[16] ? cols[16].trim() : '',
            hipertenso: cols[17] ? cols[17].trim() : '',
            diabetico: cols[18] ? cols[18].trim() : '',
            doenca_respiratoria: cols[19] ? cols[19].trim() : '',
            tuberculose: cols[20] ? cols[20].trim() : '',
            tem_teve_cancer: cols[21] ? cols[21].trim() : '',
            possui_deficiencia: cols[22] ? cols[22].trim() : '',
            ultima_atualizacao: cols[23] ? cols[23].trim() : null 
        };
    }).filter(row => row !== null); 

    return processedData;
}

function initBarChart(data, selectedCondition) {
    
    const healthConditions = [
        'hipertenso', 
        'diabetico', 
        'doenca_respiratoria', 
        'tuberculose', 
        'internacao_ult_12meses', 
        'prob_saude_mental', 
        'possui_deficiencia', 
        'tem_teve_cancer'
    ];

    const legendLabels = {
        'hipertenso': 'Hipertenso',
        'diabetico': 'Diabético',
        'doenca_respiratoria': 'Doença Respiratória',
        'tuberculose': 'Tuberculose',
        'internacao_ult_12meses': 'Internação Ult. 12 meses',
        'prob_saude_mental': 'Prob. Saúde Mental',
        'possui_deficiencia': 'Possui Deficiência',
        'tem_teve_cancer': 'Tem/Teve Câncer'
    };

    const ageGroups = {};

    
    data.forEach(item => {
        const ageGroup = item.faixa_etaria;
        if (!ageGroups[ageGroup]) {
            ageGroups[ageGroup] = {};
            healthConditions.forEach(condition => {
                ageGroups[ageGroup][condition] = 0;
            });
        }

        healthConditions.forEach(condition => {
            if (item[condition] === 'SIM') {
                ageGroups[ageGroup][condition]++;
            }
        });
    });

    
    const categories = Object.keys(ageGroups).sort((a, b) => {
        
        return a.localeCompare(b);
    });

    const seriesData = {
        name: legendLabels[selectedCondition] || selectedCondition
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase()),
        type: 'bar',
        itemStyle: {
            color: '#4e96d1' 
        },
        data: categories.map(category => ageGroups[category][selectedCondition] || 0)
    };

    chart = echarts.init(document.getElementById('barChart'));

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: [legendLabels[selectedCondition] || selectedCondition
                .replace(/_/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase())],
            top: '1%',
            left: 'center',
            textStyle: {
                fontSize: 14
            },
            orient: 'horizontal'
        },
        grid: {
            left: '10%',
            right: '7%',
            top: '20%',
            bottom: '10%'
        },
        xAxis: {
            type: 'category',
            data: categories,
        },
        yAxis: {
            type: 'value',
            name: 'Quantidade',
            nameLocation: 'middle',
            nameGap: 30
        },
        series: [seriesData],
        label: {
            show: true,
            position: 'top',
            formatter: function(params) {
                return params.value > 0 ? params.value : '';
            },
            backgroundColor: 'transparent', 
            borderColor: 'transparent', 
            borderWidth: 0 
        }
    };

    chart.setOption(option);
}

function initBarChartTimeVsHealth(data) {
    const conditions = [
        'hipertenso',
        'diabetico',
        'doenca_respiratoria',
        'tuberculose',
        'internacao_ult_12meses',
        'prob_saude_mental',
        'possui_deficiencia',
        'tem_teve_cancer'
    ];

    const legendLabels = {
        'hipertenso': 'Hipertenso',
        'diabetico': 'Diabético',
        'doenca_respiratoria': 'Doença Respiratória',
        'tuberculose': 'Tuberculose',
        'internacao_ult_12meses': 'Internação Ult. 12 meses',
        'prob_saude_mental': 'Prob. Saúde Mental',
        'possui_deficiencia': 'Possui Deficiência',
        'tem_teve_cancer': 'Tem/Teve Câncer'
    };

    let timeCategories = [
        '1 a 5 anos',
        '6 a 12 meses',
        'menos de 6 meses',
        'mais de 5 anos',
        'nao informado'
    ];

    const counts = conditions.reduce((acc, condition) => {
        acc[condition] = timeCategories.reduce((catAcc, category) => {
            catAcc[category] = { withCondition: 0, withoutCondition: 0 };
            return catAcc;
        }, {});
        return acc;
    }, {});

    data.forEach(item => {
        const timeCategory = item.tempo_morador_de_rua;
        conditions.forEach(condition => {
            if (counts[condition][timeCategory]) {
                if (item[condition] === 'SIM') {
                    counts[condition][timeCategory].withCondition++;
                } else {
                    counts[condition][timeCategory].withoutCondition++;
                }
            }
        });
    });

    timeCategories.sort((a, b) => {
        const totalA = conditions.reduce((sum, condition) => sum + counts[condition][a].withCondition, 0);
        const totalB = conditions.reduce((sum, condition) => sum + counts[condition][b].withCondition, 0);
        return totalB - totalA; 
    });

    const series = conditions.map(condition => {
        return {
            name: legendLabels[condition] || condition.replace(/_/g, ' ').toUpperCase(),
            type: 'bar',
            stack: 'total',
            data: timeCategories.map(category => counts[condition][category].withCondition),
            emphasis: {
                focus: 'series'
            }
        };
    });

    chart2 = echarts.init(document.getElementById('barChart2'));

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: conditions.map(cond => legendLabels[cond] || cond.replace(/_/g, ' ').toUpperCase()),
            top: '3%',
            left: '7%',
        },
        grid: {
            left: '5%',
            right: '0%',
            top: '30%',
            bottom: '10%'
        },
        xAxis: {
            type: 'category',
            data: timeCategories
        },
        yAxis: {
            type: 'value',
            name: 'Quantidade',
            nameLocation: 'middle',
            nameGap: 30
        },
        series: series
    };

    chart2.setOption(option);
}

function getYearFromDate(dateString) {
    // Verifica se a data está no formato 'DD/MM/YYYY'
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return parts[2]; 
    }
    console.error('Formato de data inválido para getYearFromDate:', dateString);
    return null; 
}

function initHistoricalBarChart(data) {
    
    const yearGenderCounts = {};

    
    data.forEach(item => {
        const year = getYearFromDate(item.data_cadastro); 
        const gender = item.sexo;

        if (!yearGenderCounts[year]) {
            yearGenderCounts[year] = { MASCULINO: 0, FEMININO: 0 };
        }

        if (gender === 'MASCULINO' || gender === 'FEMININO') {
            yearGenderCounts[year][gender]++;
        }
    });

    
    const years = Object.keys(yearGenderCounts).sort();
    const maleData = years.map(year => yearGenderCounts[year].MASCULINO);
    const femaleData = years.map(year => yearGenderCounts[year].FEMININO);

    chart3 = echarts.init(document.getElementById('barChartHistorical'));

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['Masculino', 'Feminino'],
            top: '5%',
            left: 'center',
            textStyle: {
                fontSize: 14
            },
            orient: 'horizontal'
        },
        grid: {
            left: '15%',
            right: '10%',
            top: '20%',
            bottom: '10%'
        },
        xAxis: {
            type: 'category',
            data: years,
        },
        yAxis: {
            type: 'value',
            name: 'Quantidade',
            nameLocation: 'middle',
            nameGap: 30
        },
        series: [
            {
                name: 'Masculino',
                type: 'bar',
                stack: 'total',
                data: maleData,
                itemStyle: {
                    color: '#4e96d1'
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    backgroundColor: 'transparent', 
                    borderColor: 'transparent', 
                    borderWidth: 0 
                }
            },
            {
                name: 'Feminino',
                type: 'bar',
                stack: 'total',
                data: femaleData,
                itemStyle: {
                    color: '#f56c6c'
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    backgroundColor: 'transparent', 
                    borderColor: 'transparent', 
                    borderWidth: 0 
                }
            }
        ]
    };

    chart3.setOption(option);
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function initBarChartLocation(data, locationKey) {
    const locationData = {};

    data.forEach(item => {
        const locationValue = item[locationKey];
        const raceColor = item.raca_cor;

        if (!locationData[locationValue]) {
            locationData[locationValue] = {};
        }
        if (!locationData[locationValue][raceColor]) {
            locationData[locationValue][raceColor] = 0;
        }

        locationData[locationValue][raceColor]++;
    });

    const locations = Object.keys(locationData).sort();
    const seriesData = {};

    locations.forEach(location => {
        Object.keys(locationData[location]).forEach(raceColor => {
            if (!seriesData[raceColor]) {
                seriesData[raceColor] = [];
            }
            seriesData[raceColor].push(locationData[location][raceColor]);
        });
    });

    const series = Object.keys(seriesData).map(raceColor => ({
        name: capitalizeFirstLetter(raceColor),
        type: 'bar',
        stack: 'total',
        data: seriesData[raceColor],
        emphasis: {
            focus: 'series'
        }
    }));

    const chart4 = echarts.init(document.getElementById('barChartLocation'));

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: Object.keys(seriesData).map(raceColor => capitalizeFirstLetter(raceColor)),
            top: '1%',
            left: 'center',
            textStyle: {
                fontSize: 14
            },
            orient: 'horizontal'
        },
        grid: {
            left: '12%',
            right: '10%',
            top: '20%',
            bottom: '10%'
        },
        xAxis: {
            type: 'category',
            data: locations
        },
        yAxis: {
            type: 'value',
            name: 'Quantidade',
            nameLocation: 'middle',
            nameGap: 30
        },
        series: series
    };

    chart4.setOption(option);
}



window.addEventListener('resize', function() {
    if (chart) {
        chart.resize();
    }
    if (chart2) {
        chart2.resize();
    }
    if (chart3) {
        chart3.resize();
    }
    if (chart4) {
        chart4.resize();
    }
})

loadCSV('pop-situacao-de-rua-cadastros.csv').then(data => {
    initBarChartTimeVsHealth(data);
    initHistoricalBarChart(data);
    const initialCondition = document.getElementById('conditionFilter').value;
    document.getElementById('conditionFilter').addEventListener('change', function() {
        const selectedCondition = this.value;
        initBarChart(data, selectedCondition);
    });
    const initialLocation = document.getElementById('locationFilter').value;
    document.getElementById('locationFilter').addEventListener('change', function() {
        const selectedLocation = this.value;
        initBarChartLocation(data, selectedLocation);
    });
    initBarChartLocation(data, initialLocation);
    initBarChart(data, initialCondition);
});
