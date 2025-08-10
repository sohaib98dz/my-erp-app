import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setLogLevel, query, getDocs, runTransaction, where, setDoc, serverTimestamp, enablePersistence } from 'firebase/firestore';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// --- FIREBASE CONFIGURATION ---
// IMPORTANT: Replace these with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
const appId = "YOUR_PROJECT_ID"; 

// --- ICON COMPONENTS ---
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconTeam = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.273-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.273-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconInventory = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const IconProducts = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IconFinance = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const IconSalary = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconOrders = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IconSuppliers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 18h1a1 1 0 001-1v-3.333a1 1 0 00-.4-1.932l-3.333-1.333a1 1 0 00-1.2.4L13 16" /></svg>;
const IconPurchasing = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-7-8h14" /></svg>;
const IconTimeline = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconReports = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


// --- PDF EXPORT HELPER ---
const loadPdfScripts = async () => {
    if (!window.jspdf) {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(jspdfScript);
        await new Promise(resolve => jspdfScript.onload = resolve);
    }
    if (!window.jspdf.autoTable) {
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        document.head.appendChild(autoTableScript);
        await new Promise(resolve => autoTableScript.onload = resolve);
    }
    return window.jspdf;
};


// --- MAIN APP COMPONENT ---
const App = () => {
    // --- STATE MANAGEMENT ---
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Data states
    const [employees, setEmployees] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [finances, setFinances] = useState([]);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [monthlySalaries, setMonthlySalaries] = useState([]);
    const [finishedGoods, setFinishedGoods] = useState([]);


    // --- FIREBASE INITIALIZATION & AUTHENTICATION ---
    useEffect(() => {
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(firebaseApp);
            
            // --- ENABLE OFFLINE MODE ---
            enablePersistence(firestoreDb)
              .catch((err) => {
                  if (err.code == 'failed-precondition') {
                      console.warn('Firebase persistence failed: Multiple tabs open.');
                  } else if (err.code == 'unimplemented') {
                      console.warn('Firebase persistence failed: Browser not supported.');
                  }
              });

            setDb(firestoreDb);
            const firebaseAuth = getAuth(firebaseApp);
            setLogLevel('debug');

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    } catch (error) {
                        console.error("Error signing in:", error);
                    }
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization error:", error);
        }
    }, []);

    // --- DATA SEEDING ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        const seedData = async () => {
            const employeesRef = collection(db, `artifacts/${appId}/public/data/employees`);
            const employeesSnapshot = await getDocs(query(employeesRef));

            if (employeesSnapshot.empty) {
                console.log("No employees found. Seeding initial data...");

                const inventoryRef = collection(db, `artifacts/${appId}/public/data/inventory`);
                const inventoryItems = [
                    { name: 'Denim Fabric', supplier: 'Sétif Textiles', costPerUnit: 8.50, quantity: 500, unit: 'meters', reorderPoint: 50 },
                    { name: 'Cotton Fabric', supplier: 'Sétif Textiles', costPerUnit: 5.20, quantity: 800, unit: 'meters', reorderPoint: 100 },
                    { name: 'Zippers', supplier: 'Algerian Haberdashery', costPerUnit: 0.40, quantity: 2000, unit: 'pieces', reorderPoint: 200 },
                    { name: 'Buttons', supplier: 'Algerian Haberdashery', costPerUnit: 0.15, quantity: 5000, unit: 'pieces', reorderPoint: 500 },
                    { name: 'Polyester Thread', supplier: 'Global Threads', costPerUnit: 2.00, quantity: 100, unit: 'pieces', reorderPoint: 20 },
                ];
                const inventoryPromises = inventoryItems.map(item => addDoc(inventoryRef, item));
                const inventoryDocs = await Promise.all(inventoryPromises);
                const inventoryMap = inventoryItems.reduce((acc, item, index) => {
                    acc[item.name] = inventoryDocs[index].id;
                    return acc;
                }, {});

                const productsRef = collection(db, `artifacts/${appId}/public/data/products`);
                const productItems = [
                    { name: 'Denim Jeans', sku: 'DJ001', laborCost: 12.00, sellingPrice: 49.99, materials: [{ materialId: inventoryMap['Denim Fabric'], quantity: 1.5 }, { materialId: inventoryMap['Zippers'], quantity: 1 }, { materialId: inventoryMap['Buttons'], quantity: 1 }, { materialId: inventoryMap['Polyester Thread'], quantity: 0.1 }] },
                    { name: 'Cotton T-Shirt', sku: 'CT002', laborCost: 4.50, sellingPrice: 19.99, materials: [{ materialId: inventoryMap['Cotton Fabric'], quantity: 0.8 }, { materialId: inventoryMap['Polyester Thread'], quantity: 0.05 }] },
                    { name: 'Canvas Tote Bag', sku: 'TB003', laborCost: 3.00, sellingPrice: 14.99, materials: [{ materialId: inventoryMap['Cotton Fabric'], quantity: 0.5 }, { materialId: inventoryMap['Polyester Thread'], quantity: 0.05 }] },
                ];
                const productPromises = productItems.map(item => addDoc(productsRef, item));
                const productDocs = await Promise.all(productPromises);
                const productMap = productItems.reduce((acc, item, index) => {
                    acc[item.name] = productDocs[index].id;
                    return acc;
                }, {});
                
                const finishedGoodsRef = collection(db, `artifacts/${appId}/public/data/finishedGoods`);
                const finishedGoodItems = [
                    { productId: productMap['Denim Jeans'], quantity: 50, reorderPoint: 10 },
                    { productId: productMap['Cotton T-Shirt'], quantity: 100, reorderPoint: 20 },
                    { productId: productMap['Canvas Tote Bag'], quantity: 75, reorderPoint: 15 },
                ];
                await Promise.all(finishedGoodItems.map(item => addDoc(finishedGoodsRef, item)));


                const employeeItems = [
                    { name: 'Fatima Zohra', role: 'Seamstress', hireDate: new Date('2023-01-15'), baseSalary: 40000 },
                    { name: 'Amine Belkacem', role: 'Cutter', hireDate: new Date('2023-03-01'), baseSalary: 38000 },
                    { name: 'Yasmine Cherif', role: 'Finisher', hireDate: new Date('2023-02-10'), baseSalary: 39000 },
                    { name: 'Karim Said', role: 'Manager', hireDate: new Date('2022-11-20'), baseSalary: 60000 },
                ];
                const employeePromises = employeeItems.map(item => addDoc(employeesRef, item));
                const employeeDocs = await Promise.all(employeePromises);
                const employeeMap = employeeItems.reduce((acc, item, index) => {
                    acc[item.name] = employeeDocs[index].id;
                    return acc;
                }, {});

                const dailyLogsRef = collection(db, `artifacts/${appId}/public/data/dailyLogs`);
                const logPromises = [];
                const today = new Date('2025-07-10');
                for (let i = 1; i < 25; i++) {
                    const logDate = new Date(today.getFullYear(), today.getMonth() -1, i);
                    if (i % 7 !== 0 && i % 7 !== 6) {
                         logPromises.push(addDoc(dailyLogsRef, { employeeId: employeeMap['Fatima Zohra'], date: logDate, checkInTime: '08:58', checkOutTime: '17:03', production: [{ productId: productMap['Denim Jeans'], quantity: 7 }, { productId: productMap['Cotton T-Shirt'], quantity: 12 }], notes: i === 15 ? 'Machine 2 needs oiling.' : '' }));
                         logPromises.push(addDoc(dailyLogsRef, { employeeId: employeeMap['Yasmine Cherif'], date: logDate, checkInTime: '09:02', checkOutTime: '17:00', production: [ { productId: productMap['Canvas Tote Bag'], quantity: 20 } ], notes: '' }));
                    }
                }
                await Promise.all(logPromises);
                
                const suppliersRef = collection(db, `artifacts/${appId}/public/data/suppliers`);
                const supplierItems = [
                    { name: 'Sétif Textiles', contact: 'contact@setiftex.dz', phone: '+213-555-1234' },
                    { name: 'Algerian Haberdashery', contact: 'sales@alghaber.dz', phone: '+213-555-5678' },
                ];
                await Promise.all(supplierItems.map(s => addDoc(suppliersRef, s)));

                const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
                const orderItems = [
                    { customerName: 'Boutique Chic', orderDate: new Date(today.getFullYear(), today.getMonth() -1, 10), status: 'Delivered', items: [{ productId: productMap['Denim Jeans'], quantity: 20, price: 49.99 }, { productId: productMap['Cotton T-Shirt'], quantity: 50, price: 19.99 }], statusHistory: [{status: 'Pending', timestamp: new Date(today.getFullYear(), today.getMonth() -1, 10)}, {status: 'In Production', timestamp: new Date(today.getFullYear(), today.getMonth() -1, 11)}, {status: 'Delivered', timestamp: new Date(today.getFullYear(), today.getMonth() -1, 15)}] },
                    { customerName: 'Urban Style', orderDate: new Date(today.getFullYear(), today.getMonth() -1, 22), status: 'In Production', items: [{ productId: productMap['Canvas Tote Bag'], quantity: 100, price: 14.99 }], statusHistory: [{status: 'Pending', timestamp: new Date(today.getFullYear(), today.getMonth() -1, 22)}, {status: 'In Production', timestamp: new Date(today.getFullYear(), today.getMonth() -1, 23)}] },
                ];
                await Promise.all(orderItems.map(o => addDoc(ordersRef, o)));


                const financesRef = collection(db, `artifacts/${appId}/public/data/finances`);
                const financeItems = [
                    { date: new Date(today.getFullYear(), today.getMonth() -1, 5), description: 'Sale - Boutique Chic', type: 'income', amount: 1999.00, category: 'Sales' },
                    { date: new Date(today.getFullYear(), today.getMonth() -1, 2), description: 'Fabric Purchase', type: 'expense', amount: 1500.00, category: 'Raw Materials' },
                    { date: new Date(today.getFullYear(), today.getMonth() -1, 1), description: 'Monthly Rent', type: 'expense', amount: 2500.00, category: 'Overhead' },
                ];
                await Promise.all(financeItems.map(item => addDoc(financesRef, item)));

                console.log("Initial data seeded successfully.");
            }
        };

        seedData().catch(console.error);
    }, [isAuthReady, db]);

    // --- DATA FETCHING (FIRESTORE) ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        const collectionsToFetch = {
            employees: collection(db, `artifacts/${appId}/public/data/employees`),
            inventory: collection(db, `artifacts/${appId}/public/data/inventory`),
            products: collection(db, `artifacts/${appId}/public/data/products`),
            finances: collection(db, `artifacts/${appId}/public/data/finances`),
            dailyLogs: collection(db, `artifacts/${appId}/public/data/dailyLogs`),
            orders: collection(db, `artifacts/${appId}/public/data/orders`),
            suppliers: collection(db, `artifacts/${appId}/public/data/suppliers`),
            purchaseOrders: collection(db, `artifacts/${appId}/public/data/purchaseOrders`),
            monthlySalaries: collection(db, `artifacts/${appId}/public/data/monthlySalaries`),
            finishedGoods: collection(db, `artifacts/${appId}/public/data/finishedGoods`),
        };

        const unsubscribes = Object.entries(collectionsToFetch).map(([name, collRef]) => {
            return onSnapshot(query(collRef), (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                switch (name) {
                    case 'employees': setEmployees(data); break;
                    case 'inventory': setInventory(data); break;
                    case 'products': setProducts(data); break;
                    case 'finances': setFinances(data); break;
                    case 'dailyLogs': setDailyLogs(data); break;
                    case 'orders': setOrders(data); break;
                    case 'suppliers': setSuppliers(data); break;
                    case 'purchaseOrders': setPurchaseOrders(data); break;
                    case 'monthlySalaries': setMonthlySalaries(data); break;
                    case 'finishedGoods': setFinishedGoods(data); break;
                    default: break;
                }
            }, (error) => console.error(`Error fetching ${name}:`, error));
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [isAuthReady, db]);

    // --- CRUD HELPER ---
    const handleCrud = async (collectionName, operation, data, id = null) => {
        if (!db) return;
        const collPath = `artifacts/${appId}/public/data/${collectionName}`;
        try {
            switch (operation) {
                case 'add':
                    await addDoc(collection(db, collPath), data);
                    break;
                case 'update':
                    if (!id) throw new Error("Update operation requires an ID.");
                    await updateDoc(doc(db, collPath, id), data);
                    break;
                case 'set':
                    if (!id) throw new Error("Set operation requires an ID.");
                    await setDoc(doc(db, collPath, id), data);
                    break;
                case 'delete':
                    if (!id) throw new Error("Delete operation requires an ID.");
                    await deleteDoc(doc(db, collPath, id));
                    break;
                default: break;
            }
        } catch (error) {
            console.error(`Firestore error (${operation} on ${collectionName}):`, error);
        }
    };

    // --- UI COMPONENTS ---
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
        { id: 'orders', label: 'Orders', icon: <IconOrders /> },
        { id: 'team', label: 'Team', icon: <IconTeam /> },
        { id: 'salary', label: 'Salary', icon: <IconSalary /> },
        { id: 'inventory', label: 'Inventory', icon: <IconInventory /> },
        { id: 'suppliers', label: 'Suppliers', icon: <IconSuppliers /> },
        { id: 'purchasing', label: 'Purchasing', icon: <IconPurchasing /> },
        { id: 'products', label: 'Products', icon: <IconProducts /> },
        { id: 'finance', label: 'Finance', icon: <IconFinance /> },
        { id: 'reports', label: 'Reports', icon: <IconReports /> },
    ];

    const Sidebar = () => (
        <aside className={`bg-gray-800 text-white ${isSidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
            <div className="p-4 flex items-center justify-between">
                <span className={`font-bold text-2xl ${!isSidebarOpen && 'hidden'}`}>ERP</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
            </div>
            <nav>
                <ul>
                    {menuItems.map(item => (
                        <li key={item.id} className={`flex items-center p-4 cursor-pointer hover:bg-gray-700 ${activeView === item.id && 'bg-blue-600'}`} onClick={() => setActiveView(item.id)}>
                            {item.icon}
                            <span className={`ml-4 ${!isSidebarOpen && 'hidden'}`}>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="absolute bottom-4 left-4 text-xs text-gray-400">
                {isSidebarOpen && userId && <p>User ID: {userId.substring(0,10)}...</p>}
            </div>
        </aside>
    );

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView dailyLogs={dailyLogs} employees={employees} finances={finances} />;
            case 'orders': return <OrdersView />;
            case 'team': return <TeamView />;
            case 'salary': return <SalaryView products={products} />;
            case 'inventory': return <InventoryView />;
            case 'suppliers': return <SuppliersView />;
            case 'purchasing': return <PurchasingView />;
            case 'products': return <ProductsView />;
            case 'finance': return <FinanceView />;
            case 'reports': return <ReportsView products={products} inventory={inventory} orders={orders} finishedGoods={finishedGoods} />;
            default: return <DashboardView dailyLogs={dailyLogs} employees={employees} finances={finances} />;
        }
    };
    
    // --- VIEWS / MODULES ---

    const DashboardView = ({ dailyLogs, employees, finances }) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
        const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

        const filteredData = useMemo(() => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); 

            const filteredLogs = dailyLogs.filter(log => {
                if (!log.date || !log.date.seconds) return false;
                const logDate = new Date(log.date.seconds * 1000);
                return logDate >= start && logDate <= end;
            });

            const filteredFinances = finances.filter(f => {
                if (!f.date || !f.date.seconds) return false;
                const fDate = new Date(f.date.seconds * 1000);
                return fDate >= start && fDate <= end;
            });

            return { logs: filteredLogs, finances: filteredFinances };
        }, [startDate, endDate, dailyLogs, finances]);

        const totalIncome = useMemo(() => filteredData.finances.filter(f => f.type === 'income').reduce((sum, f) => sum + Number(f.amount || 0), 0), [filteredData.finances]);
        const totalExpenses = useMemo(() => filteredData.finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + Number(f.amount || 0), 0), [filteredData.finances]);
        const netProfit = totalIncome - totalExpenses;

        const performanceData = useMemo(() => {
            const employeePerformance = filteredData.logs.reduce((acc, log) => {
                const employeeName = employees.find(e => e.id === log.employeeId)?.name || 'Unknown';
                const totalQuantity = log.production?.reduce((sum, prod) => sum + Number(prod.quantity || 0), 0) || 0;
                acc[employeeName] = (acc[employeeName] || 0) + totalQuantity;
                return acc;
            }, {});
            return {
                labels: Object.keys(employeePerformance),
                datasets: [{
                    label: 'Units Produced',
                    data: Object.values(employeePerformance),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                }]
            };
        }, [filteredData.logs, employees]);

        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
                
                <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex items-center space-x-4">
                    <label className="font-bold">From:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                    <label className="font-bold">To:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="font-bold text-lg">Total Income</h3><p className="text-3xl text-green-500">${totalIncome.toFixed(2)}</p></div>
                    <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="font-bold text-lg">Total Expenses</h3><p className="text-3xl text-red-500">${totalExpenses.toFixed(2)}</p></div>
                    <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="font-bold text-lg">Net Profit</h3><p className={`text-3xl ${netProfit >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>${netProfit.toFixed(2)}</p></div>
                </div>
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-4">Employee Performance in Range</h3>
                    <Bar data={performanceData} />
                </div>
            </div>
        );
    };

    const OrdersView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingOrder, setEditingOrder] = useState(null);
        const [selectedRows, setSelectedRows] = useState([]);
        const [showTimelineModal, setShowTimelineModal] = useState(false);
        const [timelineData, setTimelineData] = useState([]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
        const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

        const filteredOrders = useMemo(() => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return orders.filter(order => {
                if (!order.orderDate?.seconds) return false;
                const orderDate = new Date(order.orderDate.seconds * 1000);
                return orderDate >= start && orderDate <= end;
            });
        }, [orders, startDate, endDate]);

        const handleSelectRow = (id) => {
            setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
        };

        const handleSelectAll = (e) => {
            if (e.target.checked) {
                setSelectedRows(filteredOrders.map(o => o.id));
            } else {
                setSelectedRows([]);
            }
        };

        const handleAdd = () => { setEditingOrder(null); setShowModal(true); };
        const handleEdit = (order) => { setEditingOrder(order); setShowModal(true); };
        const handleViewTimeline = (history) => {
            setTimelineData(history);
            setShowTimelineModal(true);
        };

        const getStatusColor = (status) => {
            switch(status) {
                case 'Pending': return 'bg-yellow-100 text-yellow-800';
                case 'Preparing': return 'bg-indigo-100 text-indigo-800';
                case 'In Production': return 'bg-blue-100 text-blue-800';
                case 'Ready to Deliver': return 'bg-purple-100 text-purple-800';
                case 'Delivered': return 'bg-green-100 text-green-800';
                case 'Cancelled': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };
        
        const exportOrdersPDF = async () => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Customer Orders", 14, 16);
            
            const dataToExport = selectedRows.length > 0 ? orders.filter(o => selectedRows.includes(o.id)) : filteredOrders;

            doc.autoTable({
                startY: 22,
                head: [['Order Date', 'Customer', 'Total Value', 'Status']],
                body: dataToExport.map(order => {
                    const totalValue = order.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0;
                    return [
                        order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A',
                        order.customerName,
                        `$${totalValue.toFixed(2)}`,
                        order.status
                    ];
                })
            });
            doc.save(`Orders_${new Date().toISOString().split('T')[0]}.pdf`);
        };


        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Customer Orders</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">New Order</button>
                        <button onClick={exportOrdersPDF} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex items-center space-x-4">
                    <label className="font-bold">From:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                    <label className="font-bold">To:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr>
                    <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === filteredOrders.length && filteredOrders.length > 0} /></th>
                    <th className="p-4">Order Date</th><th className="p-4">Customer</th><th className="p-4">Total Value</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {filteredOrders.map(order => {
                        const totalValue = order.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0;
                        return (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-4"><input type="checkbox" checked={selectedRows.includes(order.id)} onChange={() => handleSelectRow(order.id)} /></td>
                            <td className="p-4">{order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-4">{order.customerName}</td>
                            <td className="p-4">${totalValue.toFixed(2)}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                            <td className="p-4 flex items-center space-x-2">
                                <button onClick={() => handleViewTimeline(order.statusHistory)} className="text-gray-500 hover:text-blue-600"><IconTimeline /></button>
                                <button onClick={() => handleEdit(order)} className="text-yellow-500 hover:text-yellow-700">Edit</button>
                                <button onClick={() => handleCrud('orders', 'delete', null, order.id)} className="text-red-500 hover:text-red-700">Delete</button>
                            </td>
                        </tr>
                    )})}
                </tbody></table></div>
                {showModal && <OrderModal order={editingOrder} products={products} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('orders', id ? 'update' : 'add', data, id)} />}
                {showTimelineModal && <TimelineModal history={timelineData} onClose={() => setShowTimelineModal(false)} title="Order Timeline" />}
            </div>
        );
    };

    const TeamView = () => {
        const [selectedEmployee, setSelectedEmployee] = useState(null);
        const [showAddModal, setShowAddModal] = useState(false);
        const [selectedRows, setSelectedRows] = useState([]);

        const handleSelectRow = (id) => {
            setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
        };

        const handleSelectAll = (e) => {
            if (e.target.checked) {
                setSelectedRows(employees.map(o => o.id));
            } else {
                setSelectedRows([]);
            }
        };

        const employeeLogs = useMemo(() => {
            if (!selectedEmployee) return [];
            return dailyLogs.filter(log => log.employeeId === selectedEmployee.id);
        }, [dailyLogs, selectedEmployee]);
        
        const exportTeamPDF = async () => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Employee List", 14, 16);
            
            const dataToExport = selectedRows.length > 0 ? employees.filter(e => selectedRows.includes(e.id)) : employees;
            
            doc.autoTable({
                startY: 22,
                head: [['Name', 'Role', 'Base Salary']],
                body: dataToExport.map(emp => [
                    emp.name,
                    emp.role,
                    `$${(emp.baseSalary || 0).toFixed(2)}`
                ])
            });
            doc.save(`Team_${new Date().toISOString().split('T')[0]}.pdf`);
        };


        if (selectedEmployee) {
            return <EmployeeDetailView employee={selectedEmployee} products={products} logs={employeeLogs} onBack={() => setSelectedEmployee(null)} handleCrud={handleCrud} db={db} />
        }

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <div>
                        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">Add Employee</button>
                        <button onClick={exportTeamPDF} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === employees.length && employees.length > 0} /></th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="border-b hover:bg-gray-50">
                                <td className="p-4"><input type="checkbox" checked={selectedRows.includes(emp.id)} onChange={() => handleSelectRow(emp.id)} /></td>
                                <td className="p-4 font-semibold">{emp.name}</td>
                                <td className="p-4">{emp.role}</td>
                                <td className="p-4">
                                    <button onClick={() => setSelectedEmployee(emp)} className="text-blue-500 hover:underline">View Details</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                {showAddModal && <EmployeeModal onClose={() => setShowAddModal(false)} onSave={(data, id) => handleCrud('employees', id ? 'update' : 'add', data, id)} />}
            </div>
        );
    };

    const EmployeeDetailView = ({ employee, products, logs, onBack, db }) => {
        const [logData, setLogData] = useState({
            date: new Date().toISOString().split('T')[0],
            checkInTime: '09:00',
            checkOutTime: '17:00',
            production: [{ productId: '', quantity: 1 }],
            notes: '',
        });
        const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

        const handleLogChange = (e) => setLogData({ ...logData, [e.target.name]: e.target.value });
        const handleProductionChange = (index, field, value) => {
            const newProduction = [...logData.production];
            newProduction[index][field] = value;
            setLogData({ ...logData, production: newProduction });
        };
        const addProductionItem = () => setLogData({ ...logData, production: [...logData.production, { productId: '', quantity: 1 }] });
        const removeProductionItem = (index) => {
            const newProduction = logData.production.filter((_, i) => i !== index);
            setLogData({ ...logData, production: newProduction });
        };

        const handleSaveLog = async (e) => {
            e.preventDefault();
            if (!db) return;

            const dataToSave = {
                ...logData,
                employeeId: employee.id,
                date: new Date(logData.date),
                production: logData.production.filter(p => p.productId && p.quantity > 0).map(p => ({ ...p, quantity: Number(p.quantity) })),
            };

            if (dataToSave.production.length === 0) {
                await addDoc(collection(db, `artifacts/${appId}/public/data/dailyLogs`), dataToSave);
                setLogData({ date: new Date().toISOString().split('T')[0], checkInTime: '09:00', checkOutTime: '17:00', production: [{ productId: '', quantity: 1 }], notes: '' });
                setAlert({ show: true, message: 'Log saved without production.', type: 'success' });
                return;
            }

            try {
                await runTransaction(db, async (transaction) => {
                    const requiredMaterials = new Map();
                    for (const prod of dataToSave.production) {
                        const productDef = products.find(p => p.id === prod.productId);
                        if (productDef && productDef.materials) {
                            for (const material of productDef.materials) {
                                const needed = material.quantity * prod.quantity;
                                requiredMaterials.set(material.materialId, (requiredMaterials.get(material.materialId) || 0) + needed);
                            }
                        }
                    }

                    const inventoryDocs = new Map();
                    for (const materialId of requiredMaterials.keys()) {
                        const itemRef = doc(db, `artifacts/${appId}/public/data/inventory`, materialId);
                        const itemDoc = await transaction.get(itemRef);
                        if (!itemDoc.exists()) throw new Error(`Material with ID ${materialId} not found.`);
                        inventoryDocs.set(materialId, itemDoc);
                    }

                    for (const [materialId, neededQuantity] of requiredMaterials.entries()) {
                        const itemDoc = inventoryDocs.get(materialId);
                        const currentQuantity = itemDoc.data().quantity;
                        if (currentQuantity < neededQuantity) {
                            throw new Error(`Insufficient stock for ${itemDoc.data().name}. Required: ${neededQuantity}, Available: ${currentQuantity}`);
                        }
                    }

                    const newLogRef = doc(collection(db, `artifacts/${appId}/public/data/dailyLogs`));
                    transaction.set(newLogRef, dataToSave);

                    for (const [materialId, neededQuantity] of requiredMaterials.entries()) {
                        const itemRef = doc(db, `artifacts/${appId}/public/data/inventory`, materialId);
                        const itemDoc = inventoryDocs.get(materialId);
                        const newQuantity = itemDoc.data().quantity - neededQuantity;
                        transaction.update(itemRef, { quantity: newQuantity });
                    }
                });
                setLogData({ date: new Date().toISOString().split('T')[0], checkInTime: '09:00', checkOutTime: '17:00', production: [{ productId: '', quantity: 1 }], notes: '' });
                setAlert({ show: true, message: 'Log saved and inventory updated!', type: 'success' });
            } catch (e) {
                console.error("Transaction failed: ", e);
                setAlert({ show: true, message: e.message, type: 'error' });
            }
        };

        const performanceChartData = useMemo(() => {
            const sortedLogs = logs
                .map(log => ({ ...log, dateObj: new Date(log.date.seconds * 1000) }))
                .sort((a, b) => a.dateObj - b.dateObj);

            const dailyTotals = sortedLogs.reduce((acc, log) => {
                const dateStr = log.dateObj.toLocaleDateString();
                const totalQuantity = log.production?.reduce((sum, p) => sum + Number(p.quantity || 0), 0) || 0;
                acc[dateStr] = (acc[dateStr] || 0) + totalQuantity;
                return acc;
            }, {});

            return {
                labels: Object.keys(dailyTotals),
                datasets: [{
                    label: 'Units Produced Daily',
                    data: Object.values(dailyTotals),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                }]
            };
        }, [logs]);

        return (
            <div className="p-6 relative">
                {alert.show && <AlertModal message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />}
                <button onClick={onBack} className="mb-6 text-blue-500 hover:underline">&larr; Back to Team List</button>
                <h1 className="text-3xl font-bold mb-2">Daily Log: {employee.name}</h1>
                <p className="text-gray-600 mb-6">{employee.role}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Add New Log Entry</h2>
                        <form onSubmit={handleSaveLog}>
                            <div className="mb-4"><label className="block text-sm font-bold mb-2">Date</label><input type="date" name="date" value={logData.date} onChange={handleLogChange} className="w-full p-2 border rounded-lg" required /></div>
                            <div className="flex space-x-4 mb-4">
                                <div><label className="block text-sm font-bold mb-2">Check-in</label><input type="time" name="checkInTime" value={logData.checkInTime} onChange={handleLogChange} className="w-full p-2 border rounded-lg" required /></div>
                                <div><label className="block text-sm font-bold mb-2">Check-out</label><input type="time" name="checkOutTime" value={logData.checkOutTime} onChange={handleLogChange} className="w-full p-2 border rounded-lg" required /></div>
                            </div>
                            <div className="mb-4"><h4 className="font-bold mb-2">Production</h4>
                                {logData.production.map((prod, index) => (
                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                        <select value={prod.productId} onChange={(e) => handleProductionChange(index, 'productId', e.target.value)} className="w-1/2 p-2 border rounded-lg" required><option value="" disabled>Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                        <input type="number" min="1" value={prod.quantity} onChange={(e) => handleProductionChange(index, 'quantity', e.target.value)} placeholder="Qty" className="w-1/4 p-2 border rounded-lg" required/>
                                        <button type="button" onClick={() => removeProductionItem(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100">&times;</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addProductionItem} className="text-sm text-blue-500 hover:underline">+ Add Product</button>
                            </div>
                            <div className="mb-4"><label className="block text-sm font-bold mb-2">Notes</label><textarea name="notes" value={logData.notes} onChange={handleLogChange} rows="3" className="w-full p-2 border rounded-lg"></textarea></div>
                            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Daily Log</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Log History & Performance</h2>
                        <div className="overflow-y-auto max-h-[40vh] mb-4 pr-2">
                            <ul className="divide-y divide-gray-200">
                                {logs.map(log => (
                                    <li key={log.id} className="py-4">
                                        <p className="font-bold">{log.date ? new Date(log.date.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Attendance: {log.checkInTime} - {log.checkOutTime}</p>
                                        <div className="text-sm my-2"><p className="font-semibold">Production:</p><ul className="list-disc list-inside">{log.production?.map((p, i) => <li key={i}>{products.find(pr => pr.id === p.productId)?.name || 'Unknown'}: {p.quantity} units</li>)}</ul></div>
                                        {log.notes && <p className="text-sm bg-yellow-100 p-2 rounded-md">Notes: {log.notes}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                             <h3 className="font-bold text-lg mb-2">Performance Graph</h3>
                             <Bar data={performanceChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SalaryView = ({ products }) => {
        const [selectedDate, setSelectedDate] = useState(new Date('2025-06-10'));
        const [salaryInputs, setSalaryInputs] = useState({});
        const [expandedRow, setExpandedRow] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Employee', 'Attendance', 'Production', 'Base Paid', 'Prod. Comm.', 'Perf. Comm.', 'Total Salary'];

        const monthYear = useMemo(() => {
            return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        }, [selectedDate]);

        useEffect(() => {
            const initialInputs = {};
            const salariesForMonth = monthlySalaries.filter(s => s.monthYear === monthYear);

            employees.forEach(emp => {
                const savedSalary = salariesForMonth.find(s => s.employeeId === emp.id);
                initialInputs[emp.id] = {
                    baseSalaryPaid: savedSalary?.baseSalaryPaid ?? emp.baseSalary ?? 0,
                    productionCommission: savedSalary?.productionCommission ?? 0,
                    performanceCommission: savedSalary?.performanceCommission ?? 0,
                };
            });
            setSalaryInputs(initialInputs);
        }, [employees, monthlySalaries, monthYear]);

        const handleSalaryChange = (employeeId, field, value) => {
            const newInputs = {
                ...salaryInputs,
                [employeeId]: {
                    ...salaryInputs[employeeId],
                    [field]: Number(value)
                }
            };
            setSalaryInputs(newInputs);
        };

        const handleSaveSalary = (employeeId) => {
            const salaryData = salaryInputs[employeeId];
            const docId = `${monthYear}_${employeeId}`;
            handleCrud('monthlySalaries', 'set', {
                monthYear,
                employeeId,
                ...salaryData
            }, docId);
        };

        const totalSalaryData = useMemo(() => {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();

            return employees.map(employee => {
                const inputs = salaryInputs[employee.id] || {};
                const base = inputs.baseSalaryPaid || 0;
                const prodComm = inputs.productionCommission || 0;
                const perfComm = inputs.performanceCommission || 0;
                const total = base + prodComm + perfComm;

                const employeeLogs = dailyLogs.filter(log => {
                    if (!log.date || !log.date.seconds) return false;
                    const logDate = new Date(log.date.seconds * 1000);
                    return log.employeeId === employee.id && logDate.getFullYear() === year && logDate.getMonth() === month;
                });

                const daysAttended = new Set(employeeLogs.map(log => new Date(log.date.seconds * 1000).toLocaleDateString())).size;
                
                const productionBreakdown = employeeLogs.reduce((acc, log) => {
                    log.production?.forEach(p => {
                        const productName = products.find(prod => prod.id === p.productId)?.name || 'Unknown';
                        acc[productName] = (acc[productName] || 0) + p.quantity;
                    });
                    return acc;
                }, {});
                
                const productionDetails = Object.entries(productionBreakdown);

                return { ...employee, ...inputs, total, daysAttended, productionDetails };
            });
        }, [employees, salaryInputs, dailyLogs, selectedDate, products]);
        
        const grandTotal = useMemo(() => {
            return totalSalaryData.reduce((sum, emp) => sum + emp.total, 0);
        }, [totalSalaryData]);

        const exportToPDF = async (selectedColumns) => {
             const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            const monthName = selectedDate.toLocaleString('default', { month: 'long' });
            const year = selectedDate.getFullYear();
            
            doc.text(`Salary Report - ${monthName} ${year}`, 14, 16);
            
            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = totalSalaryData.map(emp => {
                const rowData = {
                    'Employee': emp.name,
                    'Attendance': `${emp.daysAttended} days`,
                    'Production': emp.productionDetails.map(([name, qty]) => `${qty} ${name}`).join('\n'),
                    'Base Paid': `$${emp.baseSalaryPaid.toFixed(2)}`,
                    'Prod. Comm.': `$${emp.productionCommission.toFixed(2)}`,
                    'Perf. Comm.': `$${emp.performanceCommission.toFixed(2)}`,
                    'Total Salary': `$${emp.total.toFixed(2)}`
                };
                return headers.map(header => rowData[header]);
            });

            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body,
            });
            doc.save(`Salaries_${monthName}_${year}.pdf`);
        };

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Salary Management</h1>
                    <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex items-center space-x-4">
                    <label className="font-bold">Select Month:</label>
                    <input type="month" value={monthYear} onChange={e => setSelectedDate(new Date(e.target.value + '-02'))} className="p-2 border rounded-lg"/>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Attendance</th>
                                <th className="p-4">Production Details</th>
                                <th className="p-4">Base Salary Paid</th>
                                <th className="p-4">Production Commission</th>
                                <th className="p-4">Performance Commission</th>
                                <th className="p-4 font-bold">Total Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totalSalaryData.map(emp => (
                                <React.Fragment key={emp.id}>
                                <tr className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-semibold">{emp.name}</td>
                                    <td className="p-4">{emp.daysAttended} days</td>
                                    <td className="p-4 text-sm">
                                        {emp.productionDetails.length > 0 ? (
                                            <button onClick={() => setExpandedRow(expandedRow === emp.id ? null : emp.id)} className="text-blue-600 hover:underline">
                                                {expandedRow === emp.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        ) : 'No production'}
                                    </td>
                                    <td className="p-2"><input type="number" value={salaryInputs[emp.id]?.baseSalaryPaid || ''} onBlur={() => handleSaveSalary(emp.id)} onChange={e => handleSalaryChange(emp.id, 'baseSalaryPaid', e.target.value)} className="w-full p-2 border rounded-lg"/></td>
                                    <td className="p-2"><input type="number" value={salaryInputs[emp.id]?.productionCommission || ''} onBlur={() => handleSaveSalary(emp.id)} onChange={e => handleSalaryChange(emp.id, 'productionCommission', e.target.value)} className="w-full p-2 border rounded-lg"/></td>
                                    <td className="p-2"><input type="number" value={salaryInputs[emp.id]?.performanceCommission || ''} onBlur={() => handleSaveSalary(emp.id)} onChange={e => handleSalaryChange(emp.id, 'performanceCommission', e.target.value)} className="w-full p-2 border rounded-lg"/></td>
                                    <td className="p-4 font-bold text-blue-600 text-lg">${emp.total.toFixed(2)}</td>
                                </tr>
                                {expandedRow === emp.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="7" className="p-4">
                                            <div className="max-h-32 overflow-y-auto">
                                                <ul className="list-disc list-inside">
                                                    {emp.productionDetails.map(([name, quantity]) => (
                                                        <li key={name}>{quantity} {name}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td className="p-4 text-right" colSpan="6">Grand Total</td>
                                <td className="p-4 text-blue-600 text-lg">${grandTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportToPDF} title="Export Salary Report" />}
            </div>
        );
    };
    
    const InventoryView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingItem, setEditingItem] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Material', 'Supplier', 'Quantity', 'Reorder Point'];

        const handleAdd = () => { setEditingItem(null); setShowModal(true); };
        const handleEdit = (item) => { setEditingItem(item); setShowModal(true); };
        
        const exportInventoryPDF = async (selectedColumns) => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Inventory Stock Report", 14, 16);
            
            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = inventory.map(item => {
                const rowData = {
                    'Material': item.name,
                    'Supplier': item.supplier,
                    'Quantity': `${item.quantity} ${item.unit}`,
                    'Reorder Point': `${item.reorderPoint} ${item.unit}`
                };
                return headers.map(header => rowData[header]);
            });
            
            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body
            });
            doc.save(`Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
        };


        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Inventory</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">Add Material</button>
                        <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Material Name</th><th className="p-4">Supplier</th><th className="p-4">Quantity</th><th className="p-4">Reorder Point</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {inventory.map(item => (
                        <tr key={item.id} className={`border-b hover:bg-gray-50 ${item.quantity < item.reorderPoint ? 'bg-red-50' : ''}`}>
                            <td className="p-4 font-semibold">{item.name}</td>
                            <td className="p-4">{item.supplier}</td>
                            <td className="p-4">
                                <span className={`font-bold ${item.quantity < item.reorderPoint ? 'text-red-600' : 'text-gray-800'}`}>
                                    {item.quantity} {item.unit}
                                </span>
                            </td>
                            <td className="p-4">{item.reorderPoint} {item.unit}</td>
                            <td className="p-4"><button onClick={() => handleEdit(item)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button><button onClick={() => handleCrud('inventory', 'delete', null, item.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
                        </tr>
                    ))}
                </tbody></table></div>
                {showModal && <InventoryModal item={editingItem} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('inventory', id ? 'update' : 'add', data, id)} />}
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportInventoryPDF} title="Export Inventory" />}
            </div>
        );
    };

    const SuppliersView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingSupplier, setEditingSupplier] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Name', 'Contact Person', 'Phone'];

        const handleAdd = () => { setEditingSupplier(null); setShowModal(true); };
        const handleEdit = (supplier) => { setEditingSupplier(supplier); setShowModal(true); };
        
        const exportSuppliersPDF = async (selectedColumns) => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Supplier List", 14, 16);
            
            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = suppliers.map(s => {
                const rowData = { 'Name': s.name, 'Contact Person': s.contact, 'Phone': s.phone };
                return headers.map(header => rowData[header]);
            });

            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body
            });
            doc.save(`Suppliers_${new Date().toISOString().split('T')[0]}.pdf`);
        };

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Suppliers</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">Add Supplier</button>
                        <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Name</th><th className="p-4">Contact Person</th><th className="p-4">Phone</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {suppliers.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{s.name}</td>
                            <td className="p-4">{s.contact}</td>
                            <td className="p-4">{s.phone}</td>
                            <td className="p-4"><button onClick={() => handleEdit(s)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button><button onClick={() => handleCrud('suppliers', 'delete', null, s.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
                        </tr>
                    ))}
                </tbody></table></div>
                {showModal && <SupplierModal supplier={editingSupplier} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('suppliers', id ? 'update' : 'add', data, id)} />}
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportSuppliersPDF} title="Export Suppliers" />}
            </div>
        );
    };

    const PurchasingView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingPO, setEditingPO] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Date', 'Supplier', 'Status'];

        const handleAdd = () => { setEditingPO(null); setShowModal(true); };
        const handleEdit = (po) => { setEditingPO(po); setShowModal(true); };
        
        const handleReceivePO = async (po) => {
            if (!db) return;
            try {
                await runTransaction(db, async (transaction) => {
                    for (const item of po.items) {
                        const itemRef = doc(db, `artifacts/${appId}/public/data/inventory`, item.itemId);
                        const itemDoc = await transaction.get(itemRef);
                        if (!itemDoc.exists()) {
                            throw `Item with id ${item.itemId} not found!`;
                        }
                        const newQuantity = itemDoc.data().quantity + item.quantity;
                        transaction.update(itemRef, { quantity: newQuantity });
                    }
                    const poRef = doc(db, `artifacts/${appId}/public/data/purchaseOrders`, po.id);
                    transaction.update(poRef, { status: 'Received' });
                });
                console.log("PO received and inventory updated!");
            } catch (e) {
                console.error("Transaction failed: ", e);
            }
        };
        
        const exportPurchasingPDF = async (selectedColumns) => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Purchase Orders", 14, 16);

            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = purchaseOrders.map(po => {
                const rowData = {
                    'Date': po.date ? new Date(po.date.seconds * 1000).toLocaleDateString() : 'N/A',
                    'Supplier': suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown',
                    'Status': po.status
                };
                return headers.map(header => rowData[header]);
            });

            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body
            });
            doc.save(`PurchaseOrders_${new Date().toISOString().split('T')[0]}.pdf`);
        };


        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Purchase Orders</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">New PO</button>
                        <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Date</th><th className="p-4">Supplier</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {purchaseOrders.map(po => (
                        <tr key={po.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{po.date ? new Date(po.date.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-4">{suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown'}</td>
                            <td className="p-4">{po.status}</td>
                            <td className="p-4">
                                {po.status === 'Ordered' && <button onClick={() => handleReceivePO(po)} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 mr-2">Receive</button>}
                                <button onClick={() => handleEdit(po)} className="text-yellow-500 hover:text-yellow-700 mr-2">View</button>
                            </td>
                        </tr>
                    ))}
                </tbody></table></div>
                {showModal && <PurchaseOrderModal po={editingPO} suppliers={suppliers} inventory={inventory} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('purchaseOrders', id ? 'update' : 'add', data, id)} />}
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportPurchasingPDF} title="Export Purchase Orders" />}
            </div>
        );
    };

    const ProductsView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingProduct, setEditingProduct] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Product Name', 'SKU', 'Final Cost', 'Selling Price', 'Profit'];

        const handleAdd = () => { setEditingProduct(null); setShowModal(true); };
        const handleEdit = (product) => { setEditingProduct(product); setShowModal(true); };
        const calculateMaterialCost = (product) => {
            if (!product.materials) return 0;
            return product.materials.reduce((total, mat) => {
                const inventoryItem = inventory.find(i => i.id === mat.materialId);
                return total + (inventoryItem ? inventoryItem.costPerUnit * mat.quantity : 0);
            }, 0);
        };
        
        const exportProductsPDF = async (selectedColumns) => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Product List", 14, 16);

            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = products.map(prod => {
                const materialCost = calculateMaterialCost(prod);
                const finalCost = materialCost + Number(prod.laborCost || 0);
                const profit = Number(prod.sellingPrice || 0) - finalCost;
                const rowData = {
                    'Product Name': prod.name,
                    'SKU': prod.sku,
                    'Final Cost': `$${finalCost.toFixed(2)}`,
                    'Selling Price': `$${prod.sellingPrice.toFixed(2)}`,
                    'Profit': `$${profit.toFixed(2)}`
                };
                return headers.map(header => rowData[header]);
            });

            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body
            });
            doc.save(`Products_${new Date().toISOString().split('T')[0]}.pdf`);
        };

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Products</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">Add Product</button>
                        <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Product Name</th><th className="p-4">SKU</th><th className="p-4">Raw Material Cost</th><th className="p-4">Labor Cost</th><th className="p-4">Final Cost</th><th className="p-4">Selling Price</th><th className="p-4">Profit</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {products.map(prod => {
                        const materialCost = calculateMaterialCost(prod);
                        const finalCost = materialCost + Number(prod.laborCost || 0);
                        const profit = Number(prod.sellingPrice || 0) - finalCost;
                        return (<tr key={prod.id} className="border-b hover:bg-gray-50"><td className="p-4">{prod.name}</td><td className="p-4">{prod.sku}</td><td className="p-4">${materialCost.toFixed(2)}</td><td className="p-4">${Number(prod.laborCost || 0).toFixed(2)}</td><td className="p-4 font-bold">${finalCost.toFixed(2)}</td><td className="p-4 text-green-600 font-bold">${Number(prod.sellingPrice || 0).toFixed(2)}</td><td className={`p-4 font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>${profit.toFixed(2)}</td><td className="p-4"><button onClick={() => handleEdit(prod)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button><button onClick={() => handleCrud('products', 'delete', null, prod.id)} className="text-red-500 hover:text-red-700">Delete</button></td></tr>)})}
                </tbody></table></div>
                {showModal && <ProductModal product={editingProduct} inventory={inventory} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('products', id ? 'update' : 'add', data, id)} />}
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportProductsPDF} title="Export Products" />}
            </div>
        );
    };
    
    const FinanceView = () => {
        const [showModal, setShowModal] = useState(false);
        const [editingTransaction, setEditingTransaction] = useState(null);
        const [showExportModal, setShowExportModal] = useState(false);
        const availableColumns = ['Date', 'Description', 'Category', 'Type', 'Amount'];

        const handleAdd = () => { setEditingTransaction(null); setShowModal(true); };
        const handleEdit = (transaction) => { setEditingTransaction(transaction); setShowModal(true); };
        
        const exportFinancePDF = async (selectedColumns) => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Financial Transactions", 14, 16);

            const headers = availableColumns.filter(h => selectedColumns.includes(h));
            const body = finances.map(trans => {
                const rowData = {
                    'Date': trans.date ? new Date(trans.date.seconds * 1000).toLocaleDateString() : 'N/A',
                    'Description': trans.description,
                    'Category': trans.category,
                    'Type': trans.type,
                    'Amount': `$${trans.amount.toFixed(2)}`
                };
                return headers.map(header => rowData[header]);
            });

            doc.autoTable({
                startY: 22,
                head: [headers],
                body: body
            });
            doc.save(`Finance_${new Date().toISOString().split('T')[0]}.pdf`);
        };

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Finance Tracker</h1>
                    <div>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2">Add Transaction</button>
                        <button onClick={() => setShowExportModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export to PDF</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="p-4">Date</th><th className="p-4">Description</th><th className="p-4">Category</th><th className="p-4">Type</th><th className="p-4">Amount</th><th className="p-4">Actions</th></tr></thead><tbody>
                    {finances.map(trans => (<tr key={trans.id} className="border-b hover:bg-gray-50"><td className="p-4">{trans.date ? new Date(trans.date.seconds * 1000).toLocaleDateString() : 'N/A'}</td><td className="p-4">{trans.description}</td><td className="p-4">{trans.category}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${trans.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{trans.type}</span></td><td className={`p-4 font-bold ${trans.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>${Number(trans.amount || 0).toFixed(2)}</td><td className="p-4"><button onClick={() => handleEdit(trans)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button><button onClick={() => handleCrud('finances', 'delete', null, trans.id)} className="text-red-500 hover:text-red-700">Delete</button></td></tr>))}
                </tbody></table></div>
                {showModal && <FinanceModal transaction={editingTransaction} onClose={() => setShowModal(false)} onSave={(data, id) => handleCrud('finances', id ? 'update' : 'add', data, id)} />}
                {showExportModal && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} columns={availableColumns} onExport={exportFinancePDF} title="Export Financial Transactions" />}
            </div>
        );
    };

    const ReportsView = ({ products, inventory, orders, finishedGoods }) => {
        // Combines finished goods data with product details
        const finishedGoodsReport = useMemo(() => {
            return finishedGoods.map(fg => {
                const product = products.find(p => p.id === fg.productId);
                return {
                    ...fg,
                    name: product?.name || 'Unknown Product',
                    sku: product?.sku || 'N/A',
                };
            }).sort((a,b) => a.name.localeCompare(b.name));
        }, [finishedGoods, products]);
    
        // Calculates total value of raw materials
        const rawMaterialValue = useMemo(() => {
            return inventory.reduce((total, item) => total + (item.quantity * item.costPerUnit), 0);
        }, [inventory]);
    
        // Aggregates sales data by date for the line chart
        const salesTrendData = useMemo(() => {
            const dailySales = orders.reduce((acc, order) => {
                if (order.status === 'Delivered' && order.orderDate?.seconds) {
                    const dateStr = new Date(order.orderDate.seconds * 1000).toLocaleDateString();
                    const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    acc[dateStr] = (acc[dateStr] || 0) + orderTotal;
                }
                return acc;
            }, {});
    
            const sortedDates = Object.keys(dailySales).sort((a, b) => new Date(a) - new Date(b));
            return {
                labels: sortedDates,
                datasets: [{
                    label: 'Total Sales ($)',
                    data: sortedDates.map(date => dailySales[date]),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            };
        }, [orders]);
    
        // Calculates profit for each product and prepares data for the pie chart
        const profitByProductData = useMemo(() => {
            const productProfits = products.reduce((acc, product) => {
                acc[product.id] = { name: product.name, totalProfit: 0 };
                return acc;
            }, {});
    
            orders.forEach(order => {
                if (order.status === 'Delivered') {
                    order.items.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                            const materialCost = product.materials?.reduce((total, mat) => {
                                const invItem = inventory.find(i => i.id === mat.materialId);
                                return total + (invItem ? invItem.costPerUnit * mat.quantity : 0);
                            }, 0) || 0;
                            const totalCost = materialCost + (product.laborCost || 0);
                            const profitPerUnit = item.price - totalCost;
                            productProfits[item.productId].totalProfit += profitPerUnit * item.quantity;
                        }
                    });
                }
            });
    
            const filteredProfits = Object.values(productProfits).filter(p => p.totalProfit > 0);
    
            return {
                labels: filteredProfits.map(p => p.name),
                datasets: [{
                    label: 'Total Profit ($)',
                    data: filteredProfits.map(p => p.totalProfit),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                }]
            };
        }, [orders, products, inventory]);

        // Handles exporting a summary report to PDF
        const exportSummaryPDF = async () => {
            const { jsPDF } = await loadPdfScripts();
            const doc = new jsPDF();
            doc.text("Comprehensive Business Report", 14, 16);
            doc.setFontSize(10);
            doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 22);

            doc.setFontSize(12);
            doc.text("Finished Goods Stock", 14, 32);
            doc.autoTable({
                startY: 35,
                head: [['Product', 'SKU', 'Current Stock', 'Reorder Point']],
                body: finishedGoodsReport.map(item => [
                    item.name,
                    item.sku,
                    item.quantity,
                    item.reorderPoint
                ]),
            });
            
            const finalY = doc.autoTable.previous.finalY;
            doc.text(`Total Raw Material Value: $${rawMaterialValue.toFixed(2)}`, 14, finalY + 10);

            doc.save(`Business_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        };
    
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Business Reports</h1>
                     <button onClick={exportSummaryPDF} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Export Summary PDF</button>
                </div>
    
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Finished Goods Table */}
                    <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Finished Goods Inventory</h2>
                        <div className="overflow-x-auto max-h-[40vh]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-4">Product Name</th>
                                        <th className="p-4">SKU</th>
                                        <th className="p-4">Current Stock</th>
                                        <th className="p-4">Reorder Point</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {finishedGoodsReport.map(item => (
                                        <tr key={item.id} className={`border-b hover:bg-gray-50 ${item.quantity < item.reorderPoint ? 'bg-red-50' : ''}`}>
                                            <td className="p-4 font-semibold">{item.name}</td>
                                            <td className="p-4">{item.sku}</td>
                                            <td className={`p-4 font-bold ${item.quantity < item.reorderPoint ? 'text-red-600' : 'text-gray-800'}`}>{item.quantity}</td>
                                            <td className="p-4">{item.reorderPoint}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
    
                    {/* Sales Trend Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Sales Trend (Delivered Orders)</h2>
                        <Line data={salesTrendData} />
                    </div>
    
                    {/* Profit by Product Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h2 className="text-xl font-bold mb-4">Profit by Product (Delivered Orders)</h2>
                         <div className="w-full h-64 flex justify-center">
                            <Pie data={profitByProductData} options={{ maintainAspectRatio: false }} />
                         </div>
                    </div>

                     {/* Key Metrics */}
                     <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-800">Total Raw Material Value</h3>
                                <p className="text-2xl font-semibold text-blue-900">${rawMaterialValue.toFixed(2)}</p>
                            </div>
                            {/* You can add more metric cards here */}
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // --- MODAL COMPONENTS ---
    const Modal = ({ children, onClose, title }) => (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]"><div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button></div><div className="p-6">{children}</div></div></div>);
    const EmployeeModal = ({ employee, onClose, onSave }) => {
        const [formData, setFormData] = useState({ name: employee?.name || '', role: employee?.role || '', hireDate: employee?.hireDate ? new Date(employee.hireDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], baseSalary: employee?.baseSalary || 0 });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, hireDate: new Date(formData.hireDate), baseSalary: Number(formData.baseSalary) }, employee?.id); onClose(); };
        return (<Modal onClose={onClose} title={employee ? 'Edit Employee' : 'Add Employee'}><form onSubmit={handleSubmit}><div className="mb-4"><label className="block text-sm font-bold mb-2">Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label className="block text-sm font-bold mb-2">Role</label><input type="text" name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label className="block text-sm font-bold mb-2">Base Monthly Salary ($)</label><input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label className="block text-sm font-bold mb-2">Hire Date</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const InventoryModal = ({ item, onClose, onSave }) => {
        const [formData, setFormData] = useState({ name: item?.name || '', supplier: item?.supplier || '', costPerUnit: item?.costPerUnit || 0, quantity: item?.quantity || 0, unit: item?.unit || 'meters', reorderPoint: item?.reorderPoint || 10 });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, costPerUnit: parseFloat(formData.costPerUnit), quantity: parseInt(formData.quantity, 10), reorderPoint: parseInt(formData.reorderPoint, 10) }, item?.id); onClose(); };
        return (<Modal onClose={onClose} title={item ? 'Edit Material' : 'Add Material'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Supplier</label><input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div><div className="mb-4"><label>Cost per Unit ($)</label><input type="number" step="0.01" name="costPerUnit" value={formData.costPerUnit} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div><div className="mb-4"><label>Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Reorder Point</label><input type="number" name="reorderPoint" value={formData.reorderPoint} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Unit</label><select name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2 border rounded-lg"><option value="meters">Meters</option><option value="pieces">Pieces</option></select></div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const ProductModal = ({ product, inventory, onClose, onSave }) => {
        const [formData, setFormData] = useState({ name: product?.name || '', sku: product?.sku || '', laborCost: product?.laborCost || 0, sellingPrice: product?.sellingPrice || 0, materials: product?.materials || [{ materialId: '', quantity: 1 }], });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleMaterialChange = (index, field, value) => { const newMaterials = [...formData.materials]; newMaterials[index][field] = value; setFormData({ ...formData, materials: newMaterials }); };
        const addMaterial = () => { setFormData({ ...formData, materials: [...formData.materials, { materialId: '', quantity: 1 }]}); };
        const removeMaterial = (index) => { const newMaterials = formData.materials.filter((_, i) => i !== index); setFormData({ ...formData, materials: newMaterials }); };
        const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, laborCost: parseFloat(formData.laborCost), sellingPrice: parseFloat(formData.sellingPrice), materials: formData.materials.map(m => ({...m, quantity: parseFloat(m.quantity)})) }, product?.id); onClose(); };
        return (<Modal onClose={onClose} title={product ? 'Edit Product' : 'Add Product'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Product Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div><div className="mb-4"><label>Labor Cost ($)</label><input type="number" step="0.01" name="laborCost" value={formData.laborCost} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Selling Price ($)</label><input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><h4 className="font-bold mb-2">Raw Materials</h4>{formData.materials.map((mat, index) => (<div key={index} className="flex items-center space-x-2 mb-2"><select value={mat.materialId} onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)} className="w-1/2 p-2 border rounded-lg"><option value="">Select Material</option>{inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select><input type="number" value={mat.quantity} onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)} placeholder="Qty" className="w-1/4 p-2 border rounded-lg" /><button type="button" onClick={() => removeMaterial(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100">&times;</button></div>))}{<button type="button" onClick={addMaterial} className="text-sm text-blue-500 hover:underline">+ Add Material</button>}</div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const FinanceModal = ({ transaction, onClose, onSave }) => {
        const [formData, setFormData] = useState({ description: transaction?.description || '', type: transaction?.type || 'expense', amount: transaction?.amount || 0, date: transaction?.date ? new Date(transaction.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], category: transaction?.category || 'Uncategorized' });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, amount: parseFloat(formData.amount), date: new Date(formData.date) }, transaction?.id); onClose(); };
        const categories = ['Sales', 'Raw Materials', 'Salaries', 'Overhead', 'Utilities', 'Marketing', 'Uncategorized'];
        return (<Modal onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Description</label><input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="mb-4"><label>Type</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded-lg"><option value="expense">Expense</option><option value="income">Income</option></select></div><div className="mb-4"><label>Amount ($)</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const OrderModal = ({ order, products, onClose, onSave }) => {
        const [formData, setFormData] = useState({ customerName: order?.customerName || '', orderDate: order?.orderDate ? new Date(order.orderDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], status: order?.status || 'Pending', items: order?.items || [{ productId: '', quantity: 1, price: 0 }] });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleItemChange = (index, field, value) => {
            const newItems = [...formData.items];
            newItems[index][field] = value;
            if (field === 'productId') {
                const product = products.find(p => p.id === value);
                newItems[index]['price'] = product ? product.sellingPrice : 0;
            }
            setFormData({ ...formData, items: newItems });
        };
        const addItem = () => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, price: 0 }] });
        const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
        const handleSubmit = (e) => {
            e.preventDefault();
            let dataToSave = { ...formData, orderDate: new Date(formData.orderDate), items: formData.items.map(i => ({...i, quantity: Number(i.quantity), price: Number(i.price)})) };
            if (order) { // Editing existing order
                if (order.status !== formData.status) {
                    const newStatusHistory = [...(order.statusHistory || []), { status: formData.status, timestamp: new Date() }];
                    dataToSave.statusHistory = newStatusHistory;
                } else {
                    dataToSave.statusHistory = order.statusHistory || [];
                }
            } else { // New order
                dataToSave.statusHistory = [{ status: formData.status, timestamp: new Date() }];
            }
            onSave(dataToSave, order?.id);
            onClose();
        };
        return (<Modal onClose={onClose} title={order ? 'Edit Order' : 'New Order'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Customer Name</label><input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full p-2 border rounded-lg" required/></div><div className="mb-4"><label>Order Date</label><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required/></div><div className="mb-4"><label>Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg"><option>Pending</option><option>Preparing</option><option>In Production</option><option>Ready to Deliver</option><option>Delivered</option><option>Cancelled</option></select></div><div className="mb-4"><h4 className="font-bold mb-2">Items</h4>{formData.items.map((item, index) => (<div key={index} className="flex items-center space-x-2 mb-2"><select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-1/2 p-2 border rounded-lg"><option value="">Select Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="Qty" className="w-1/4 p-2 border rounded-lg"/><input type="number" step="0.01" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} placeholder="Price" className="w-1/4 p-2 border rounded-lg"/><button type="button" onClick={() => removeItem(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100">&times;</button></div>))}{<button type="button" onClick={addItem} className="text-sm text-blue-500 hover:underline">+ Add Item</button>}</div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const SupplierModal = ({ supplier, onClose, onSave }) => {
        const [formData, setFormData] = useState({ name: supplier?.name || '', contact: supplier?.contact || '', phone: supplier?.phone || '' });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleSubmit = (e) => { e.preventDefault(); onSave(formData, supplier?.id); onClose(); };
        return (<Modal onClose={onClose} title={supplier ? 'Edit Supplier' : 'New Supplier'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Supplier Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div className="mb-4"><label>Contact Person</label><input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div><div className="mb-4"><label>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const PurchaseOrderModal = ({ po, suppliers, inventory, onClose, onSave }) => {
        const [formData, setFormData] = useState({ supplierId: po?.supplierId || '', date: po?.date ? new Date(po.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], status: po?.status || 'Ordered', items: po?.items || [{ itemId: '', quantity: 1 }] });
        const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleItemChange = (index, field, value) => { const newItems = [...formData.items]; newItems[index][field] = value; setFormData({ ...formData, items: newItems }); };
        const addItem = () => setFormData({ ...formData, items: [...formData.items, { itemId: '', quantity: 1 }] });
        const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
        const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, date: new Date(formData.date), items: formData.items.map(i => ({...i, quantity: Number(i.quantity)})) }, po?.id); onClose(); };
        return (<Modal onClose={onClose} title={po ? 'Edit PO' : 'New PO'}><form onSubmit={handleSubmit}><div className="mb-4"><label>Supplier</label><select name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full p-2 border rounded-lg" required><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="mb-4"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-lg" required/></div><div className="mb-4"><h4 className="font-bold mb-2">Items to Order</h4>{formData.items.map((item, index) => (<div key={index} className="flex items-center space-x-2 mb-2"><select value={item.itemId} onChange={e => handleItemChange(index, 'itemId', e.target.value)} className="w-2/3 p-2 border rounded-lg"><option value="">Select Material</option>{inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select><input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="Qty" className="w-1/3 p-2 border rounded-lg"/><button type="button" onClick={() => removeItem(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100">&times;</button></div>))}{<button type="button" onClick={addItem} className="text-sm text-blue-500 hover:underline">+ Add Item</button>}</div><div className="flex justify-end"><button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button></div></form></Modal>);
    };
    const ExportModal = ({ isOpen, onClose, columns, onExport, title }) => {
        const [selectedColumns, setSelectedColumns] = useState(columns);

        const handleToggle = (col) => {
            setSelectedColumns(prev => 
                prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
            );
        };

        const handleExport = () => {
            onExport(selectedColumns);
            onClose();
        };

        if (!isOpen) return null;

        return (
            <Modal onClose={onClose} title={title || "Export Options"}>
                <div className="mb-4">
                    <p className="font-bold mb-2">Select columns to export:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {columns.map(col => (
                            <label key={col} className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    checked={selectedColumns.includes(col)}
                                    onChange={() => handleToggle(col)}
                                    className="rounded"
                                />
                                <span>{col}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleExport} className="bg-green-500 text-white px-4 py-2 rounded-lg">Export</button>
                </div>
            </Modal>
        );
    };
    const AlertModal = ({ message, type, onClose }) => {
        const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';
        
        useEffect(() => {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div className={`fixed top-5 right-5 w-full max-w-sm border-l-4 p-4 rounded-lg shadow-lg z-50 ${bgColor}`} role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg>
                    </div>
                    <div>
                        <p className="font-bold">{type === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-sm">{message}</p>
                    </div>
                     <button onClick={onClose} className="ml-auto -mt-2 -mr-1 text-2xl font-semibold">&times;</button>
                </div>
            </div>
        );
    };
    const TimelineModal = ({ history, onClose, title }) => {
        if (!history || history.length === 0) {
            return (
                <Modal onClose={onClose} title={title}>
                    <p>No history available.</p>
                </Modal>
            );
        }
    
        return (
            <Modal onClose={onClose} title={title}>
                <div className="relative pl-8">
                    <div className="absolute left-0 h-full border-l-2 border-gray-200"></div>
                    {history.map((item, index) => (
                        <div key={index} className="mb-8 relative">
                            <div className="absolute -left-[30px] top-1 h-4 w-4 rounded-full bg-blue-500"></div>
                            <p className="font-bold">{item.status}</p>
                            <p className="text-sm text-gray-500">{new Date(item.timestamp.seconds * 1000).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </Modal>
        );
    };

    // --- RENDER ---
    if (!isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="text-xl font-semibold">Loading ERP...</div></div>;
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;
