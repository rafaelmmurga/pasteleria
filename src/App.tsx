import { useState, useEffect } from 'react';
import { Package, Users, ClipboardList, AlertTriangle, Plus, Minus, Save } from 'lucide-react';
import { round } from './utils/round';

const BakeryControlSystem = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Harina', current: 50, min: 10, max: 100, unit: 'kg', cost: 25, lastUpdate: '2025-08-12' },
    { id: 2, name: 'Azúcar', current: 30, min: 15, max: 80, unit: 'kg', cost: 35, lastUpdate: '2025-08-12' },
    { id: 3, name: 'Huevos', current: 120, min: 50, max: 200, unit: 'piezas', cost: 0.8, lastUpdate: '2025-08-12' },
    { id: 4, name: 'Mantequilla', current: 8, min: 5, max: 25, unit: 'kg', cost: 85, lastUpdate: '2025-08-12' },
    { id: 5, name: 'Chocolate', current: 12, min: 8, max: 30, unit: 'kg', cost: 150, lastUpdate: '2025-08-12' },
  ]);

  const [recipes, setRecipes] = useState([
    {
      id: 1,
      name: 'Pastel de Chocolate',
      ingredients: [
        { name: 'Harina', quantity: 2, unit: 'kg' },
        { name: 'Azúcar', quantity: 1.5, unit: 'kg' },
        { name: 'Huevos', quantity: 12, unit: 'piezas' },
        { name: 'Mantequilla', quantity: 0.8, unit: 'kg' },
        { name: 'Chocolate', quantity: 1.2, unit: 'kg' }
      ],
      yield: 8,
      cost: 0
    },
    {
      id: 2,
      name: 'Pastel Vainilla',
      ingredients: [
        { name: 'Harina', quantity: 1.8, unit: 'kg' },
        { name: 'Azúcar', quantity: 1.2, unit: 'kg' },
        { name: 'Huevos', quantity: 10, unit: 'piezas' },
        { name: 'Mantequilla', quantity: 0.6, unit: 'kg' }
      ],
      yield: 6,
      cost: 0
    }
  ]);

  const [productions, setProductions] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [alerts, setAlerts] = useState([]);

  // Calcular costo de recetas
  useEffect(() => {
    const updatedRecipes = recipes.map(recipe => {
      const totalCost = recipe.ingredients.reduce((sum, ingredient) => {
        const inventoryItem = inventory.find(item => item.name === ingredient.name);
        if (inventoryItem) {
          return sum + (ingredient.quantity * inventoryItem.cost);
        }
        return sum;
      }, 0);
      return { ...recipe, cost: totalCost };
    });
    setRecipes(updatedRecipes);
  }, [inventory]);

  // Generar alertas
  useEffect(() => {
    const newAlerts = [];
    inventory.forEach(item => {
      if (item.current <= item.min) {
        newAlerts.push({
          type: 'warning',
          message: `Stock bajo: ${item.name} (${round(item.current, 2)}${item.unit})`
        });
      }
      if (item.current === 0) {
        newAlerts.push({
          type: 'error',
          message: `Sin stock: ${item.name}`
        });
      }
    });
    setAlerts(newAlerts);
  }, [inventory]);

  const updateInventory = (id, change) => {
    setInventory(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, current: Math.max(0, item.current + change), lastUpdate: new Date().toISOString().split('T')[0] }
          : item
      )
    );
  };

  const canProduce = (recipe, quantity) => {
    return recipe.ingredients.every(ingredient => {
      const inventoryItem = inventory.find(item => item.name === ingredient.name);
      return inventoryItem && inventoryItem.current >= (ingredient.quantity * quantity);
    });
  };

  const produceRecipe = () => {
    if (!selectedRecipe) return;
    
    const recipe = recipes.find(r => r.id === parseInt(selectedRecipe));
    if (!canProduce(recipe, productionQuantity)) {
      alert('Ingredientes insuficientes para esta producción');
      return;
    }

    // Descontar ingredientes del inventario
    const newInventory = inventory.map(item => {
      const ingredient = recipe.ingredients.find(ing => ing.name === item.name);
      if (ingredient) {
        return {
          ...item,
          current: item.current - (ingredient.quantity * productionQuantity),
          lastUpdate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    setInventory(newInventory);

    // Registrar producción
    const newProduction = {
      id: Date.now(),
      recipe: recipe.name,
      quantity: productionQuantity,
      totalYield: recipe.yield * productionQuantity,
      cost: recipe.cost * productionQuantity,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    };
    setProductions(prev => [newProduction, ...prev]);

    setSelectedRecipe('');
    setProductionQuantity(1);
  };

  const InventoryTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 border">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                item.current <= item.min ? 'bg-red-100 text-red-800' : 
                item.current <= item.min + 5 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {item.current <= item.min ? 'Bajo' : item.current <= item.min + 5 ? 'Medio' : 'OK'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stock actual:</span>
                <span className="font-medium">{item.current} {item.unit}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Mínimo:</span>
                <span>{item.min} {item.unit}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Costo unitario:</span>
                <span>${item.cost}</span>
              </div>
              <div className="flex justify-center space-x-2 mt-3">
                <button 
                  onClick={() => updateInventory(item.id, -1)}
                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => updateInventory(item.id, 1)}
                  className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Última actualización: {item.lastUpdate}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const RecipesTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-lg shadow p-6 border">
            <h3 className="font-bold text-lg text-gray-800 mb-4">{recipe.name}</h3>
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-gray-700">Ingredientes:</h4>
              {recipe.ingredients.map((ingredient, idx) => {
                const inventoryItem = inventory.find(item => item.name === ingredient.name);
                const available = inventoryItem ? inventoryItem.current : 0;
                const sufficient = available >= ingredient.quantity;
                
                return (
                  <div key={idx} className={`flex justify-between text-sm p-2 rounded ${
                    sufficient ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className={sufficient ? 'text-green-800' : 'text-red-800'}>
                      {ingredient.name}: {ingredient.quantity} {ingredient.unit}
                    </span>
                    <span className={`text-xs ${sufficient ? 'text-green-600' : 'text-red-600'}`}>
                      (Disponible: {available})
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
              <span>Rendimiento: {recipe.yield} porciones</span>
              <span>Costo: ${recipe.cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded text-xs ${
                canProduce(recipe, 1) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {canProduce(recipe, 1) ? 'Disponible' : 'Sin ingredientes'}
              </span>
              <span className="text-sm text-gray-600">
                Costo por porción: ${(recipe.cost / recipe.yield).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProductionTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Nueva Producción</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receta</label>
            <select 
              value={selectedRecipe} 
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar receta</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de lotes</label>
            <input 
              type="number" 
              min="1" 
              value={productionQuantity}
              onChange={(e) => setProductionQuantity(parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={produceRecipe}
              disabled={!selectedRecipe}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="inline mr-2" size={16} />
              Producir
            </button>
          </div>
        </div>
        {selectedRecipe && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Resumen de Producción:</h4>
            {(() => {
              const recipe = recipes.find(r => r.id === parseInt(selectedRecipe));
              return recipe ? (
                <div className="text-sm space-y-1">
                  <p>Total de porciones: {recipe.yield * productionQuantity}</p>
                  <p>Costo total: ${(recipe.cost * productionQuantity).toFixed(2)}</p>
                  <p>Costo por porción: ${(recipe.cost / recipe.yield).toFixed(2)}</p>
                  <p className={canProduce(recipe, productionQuantity) ? 'text-green-600' : 'text-red-600'}>
                    {canProduce(recipe, productionQuantity) ? '✓ Ingredientes suficientes' : '✗ Ingredientes insuficientes'}
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg text-gray-800">Historial de Producción</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lotes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productions.map(production => (
                <tr key={production.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.date} {production.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.recipe}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.totalYield}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${production.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay producciones registradas
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AlertsTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-yellow-600" />
          Alertas del Sistema
        </h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-green-600">
            ✓ No hay alertas activas. Todo está bajo control.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}>
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border text-center">
          <div className="text-2xl font-bold text-blue-600">{inventory.length}</div>
          <div className="text-sm text-gray-600">Ingredientes registrados</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border text-center">
          <div className="text-2xl font-bold text-green-600">{productions.length}</div>
          <div className="text-sm text-gray-600">Producciones hoy</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border text-center">
          <div className="text-2xl font-bold text-red-600">
            {alerts.filter(a => a.type === 'error').length}
          </div>
          <div className="text-sm text-gray-600">Ingredientes sin stock</div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'inventory', name: 'Inventario', icon: Package, component: InventoryTab },
    { id: 'recipes', name: 'Recetas', icon: ClipboardList, component: RecipesTab },
    { id: 'production', name: 'Producción', icon: Users, component: ProductionTab },
    { id: 'alerts', name: 'Alertas', icon: AlertTriangle, component: AlertsTab },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Control de Producción - Pastelería</h1>
            <div className="flex items-center space-x-4">
              {alerts.length > 0 && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle size={20} className="mr-1" />
                  <span className="text-sm font-medium">{alerts.length} alertas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2" size={16} />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </main>
    </div>
  );
};

export default BakeryControlSystem;