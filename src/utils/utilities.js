export const filterBySearch = (items, searchTerm, searchFields) => {
    if (!searchTerm.trim()) return items;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
        searchFields.some(field =>
            item[field]?.toString().toLowerCase().includes(lowerSearchTerm)
        )
    );
};

export const exportToCSV = (data, filename) => {
    if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
