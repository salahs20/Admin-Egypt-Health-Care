import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../../../../firebase/firebase";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { FaFileExport, FaFileImport, FaTrash, FaEdit, FaComments, FaSearch, FaFilter } from "react-icons/fa";
import { MdOutlineMedicalServices } from "react-icons/md";

const StatisticsCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className={`text-4xl ${color.replace('border-', 'text-')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const FormModal = ({ isOpen, onClose, type, data, isEditing, onSubmit, isLoading, categories, handleSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {isEditing ? 
              (type === 'services' ? 'تعديل خدمة طبية' : 'تعديل نصيحة طبية') :
              (type === 'services' ? 'إضافة خدمة طبية جديدة' : 'إضافة نصيحة طبية جديدة')
            }
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'services' ? 'اسم الخدمة' : 'عنوان النصيحة'}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              value={type === 'services' ? data.name : data.title}
              onChange={(e) => onSubmit({
                ...data,
                [type === 'services' ? 'name' : 'title']: e.target.value
              })}
              placeholder={type === 'services' ? 'أدخل اسم الخدمة' : 'أدخل عنوان النصيحة'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'services' ? 'وصف الخدمة' : 'محتوى النصيحة'}
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              rows="4"
              value={type === 'services' ? data.description : data.content}
              onChange={(e) => onSubmit({
                ...data,
                [type === 'services' ? 'description' : 'content']: e.target.value
              })}
              placeholder={type === 'services' ? 'أدخل وصف الخدمة' : 'أدخل محتوى النصيحة'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              value={data.category}
              onChange={(e) => onSubmit({ ...data, category: e.target.value })}
            >
              <option value="">اختر التصنيف</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={data.isActive}
              onChange={(e) => onSubmit({ ...data, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="mr-2 text-sm text-gray-700">
              نشط
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              handleSubmit(type, data);
              onClose();
            }}
            disabled={isLoading}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? 'جاري التحميل...' : (isEditing ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceData, setServiceData] = useState({ 
    name: "", 
    description: "", 
    category: "",
    isActive: true,
    comments: []
  });
  const [adviceData, setAdviceData] = useState({ 
    title: "", 
    content: "", 
    category: "",
    isActive: true,
    comments: []
  });
  const [categoryData, setCategoryData] = useState({ name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null, type: null });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showComments, setShowComments] = useState({ id: null, type: null });
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showForm, setShowForm] = useState(false);

  const showNotification = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
    } else {
      setError(message);
    }
    setTimeout(() => {
      if (type === 'success') {
        setSuccess("");
      } else {
        setError("");
      }
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [servicesSnapshot, adviceSnapshot, categoriesSnapshot] = await Promise.all([
          getDocs(collection(db, "services")),
          getDocs(collection(db, "tips")),
          getDocs(collection(db, "categories"))
        ]);

        setServices(servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setAdvice(adviceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setCategories(categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        showNotification("Error fetching data: " + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  const handleAddCategory = async () => {
    if (!categoryData.name.trim()) {
      showNotification("يرجى إدخال اسم التصنيف", 'error');
      return;
    }
    setIsLoading(true);
    try {
      const ref = await addDoc(collection(db, "categories"), categoryData);
      setCategories([...categories, { id: ref.id, ...categoryData }]);
      setCategoryData({ name: "" });
      showNotification("تم إضافة التصنيف بنجاح");
    } catch (error) {
      showNotification("Error adding category: " + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (itemId, type) => {
    if (!newComment.trim()) {
      showNotification("يرجى إدخال نص التعليق", 'error');
      return;
    }
    setIsLoading(true);
    try {
      const comment = {
        text: newComment,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };

      const itemRef = doc(db, type, itemId);
      const item = type === "services" 
        ? services.find(s => s.id === itemId)
        : advice.find(a => a.id === itemId);

      if (!item) {
        throw new Error("Item not found");
      }

      const updatedComments = [...(item.comments || []), comment];
      await updateDoc(itemRef, { comments: updatedComments });

      if (type === "services") {
        setServices(services.map(s => 
          s.id === itemId ? { ...s, comments: updatedComments } : s
        ));
      } else {
        setAdvice(advice.map(a => 
          a.id === itemId ? { ...a, comments: updatedComments } : a
        ));
      }

      setNewComment("");
      showNotification("تم إضافة التعليق بنجاح");
    } catch (error) {
      showNotification("Error adding comment: " + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, type, id));
      if (type === "services") {
        setServices(services.filter((service) => service.id !== id));
      } else {
        setAdvice(advice.filter((item) => item.id !== id));
      }
      showNotification("تم الحذف بنجاح");
    } catch (error) {
      showNotification("Error deleting: " + error.message, 'error');
    } finally {
      setIsLoading(false);
      setDeleteConfirmation({ show: false, id: null, type: null });
    }
  };

  const validateFormData = (data, type) => {
    if (type === 'services') {
      if (!data.name?.trim()) return "يرجى إدخال اسم الخدمة";
      if (!data.description?.trim()) return "يرجى إدخال وصف الخدمة";
      if (!data.category) return "يرجى اختيار التصنيف";
    } else {
      if (!data.title?.trim()) return "يرجى إدخال عنوان النصيحة";
      if (!data.content?.trim()) return "يرجى إدخال محتوى النصيحة";
      if (!data.category) return "يرجى اختيار التصنيف";
    }
    return null;
  };

  const handleAddOrUpdate = async (type, data, setData, setList) => {
    const validationError = validateFormData(data, type);
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    setIsLoading(true);
    try {
      const itemData = {
        ...data,
        isActive: data.isActive,
        category: data.category || "",
        comments: data.comments || []
      };

      if (isEditing) {
        await updateDoc(doc(db, type, currentId), itemData);
        setList((prev) =>
          prev.map((item) => (item.id === currentId ? { id: currentId, ...itemData } : item))
        );
        showNotification("تم التحديث بنجاح");
      } else {
        const ref = await addDoc(collection(db, type), itemData);
        setList((prev) => [...prev, { id: ref.id, ...itemData }]);
        showNotification("تم الإضافة بنجاح");
      }

      if (type === 'services') {
        setServiceData({
          name: "",
          description: "",
          category: "",
          isActive: true,
          comments: []
        });
      } else {
        setAdviceData({
          title: "",
          content: "",
          category: "",
          isActive: true,
          comments: []
        });
      }
      setIsEditing(false);
      setCurrentId(null);
    } catch (error) {
      showNotification("Error adding/updating: " + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const editItem = (item, type) => {
    if (type === "services") {
      setServiceData({ 
        name: item.name || "", 
        description: item.description || "",
        category: item.category || "",
        isActive: item.isActive ?? true,
        comments: item.comments || []
      });
    } else {
      setAdviceData({ 
        title: item.title || "", 
        content: item.content || "",
        category: item.category || "",
        isActive: item.isActive ?? true,
        comments: item.comments || []
      });
    }
    setIsEditing(true);
    setCurrentId(item.id);
  };

  const exportData = (type) => {
    const data = type === 'services' ? services : advice;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`تم تصدير بيانات ${type === 'services' ? 'الخدمات' : 'النصائح'} بنجاح`);
  };

  const importData = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          showNotification(`تم استيراد ${data.length} عنصر من ${type === 'services' ? 'الخدمات' : 'النصائح'} بنجاح`);
        } else {
          showNotification("تنسيق الملف غير صحيح", 'error');
        }
      } catch (error) {
        showNotification("خطأ في قراءة الملف: " + error.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const sortData = (data, sortBy, sortOrder) => {
    return [...data].sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      if (sortBy === 'name' && !valueA) valueA = a.title || '';
      if (sortBy === 'name' && !valueB) valueB = b.title || '';
      if (sortBy === 'description' && !valueA) valueA = a.content || '';
      if (sortBy === 'description' && !valueB) valueB = b.content || '';
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getFilteredAndSortedData = (data, type) => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchableText = type === 'services' 
          ? `${item.name || ''} ${item.description || ''}`
          : `${item.title || ''} ${item.content || ''}`;
        return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => 
        filterStatus === 'active' ? item.isActive : !item.isActive
      );
    }
    
    return sortData(filtered, sortBy, sortOrder);
  };

  const filteredServices = useMemo(() => 
    getFilteredAndSortedData(services, 'services'), 
    [services, searchTerm, selectedCategory, filterStatus, sortBy, sortOrder]
  );

  const filteredAdvice = useMemo(() => 
    getFilteredAndSortedData(advice, 'tips'), 
    [advice, searchTerm, selectedCategory, filterStatus, sortBy, sortOrder]
  );

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`هل أنت متأكد من حذف التصنيف "${categoryName}"؟`)) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, "categories", categoryId));
        setCategories(categories.filter(cat => cat.id !== categoryId));
        showNotification(`تم حذف التصنيف "${categoryName}" بنجاح`);
      } catch (error) {
        showNotification("حدث خطأ أثناء حذف التصنيف: " + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderTableCell = (content) => {
    if (content === undefined || content === null || content === '') {
      return <span className="text-gray-400">-</span>;
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8 px-4 md:pl-24  pt-6">
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 max-w-md ${
          error ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500'
        } border-l-4 p-4 rounded-lg shadow-lg`}>
          <p className={error ? 'text-red-700' : 'text-green-700'}>
            {error || success}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatisticsCard 
          title="إجمالي الخدمات" 
          value={services.length} 
          icon={<MdOutlineMedicalServices />} 
          color="border-blue-500" 
        />
        <StatisticsCard 
          title="الخدمات النشطة" 
          value={services.filter(s => s.isActive).length} 
          icon={<MdOutlineMedicalServices />} 
          color="border-green-500" 
        />
        <StatisticsCard 
          title="إجمالي النصائح" 
          value={advice.length} 
          icon={<MdOutlineMedicalServices />} 
          color="border-purple-500" 
        />
        <StatisticsCard 
          title="النصائح النشطة" 
          value={advice.filter(a => a.isActive).length} 
          icon={<MdOutlineMedicalServices />} 
          color="border-yellow-500" 
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('services')}
          >
            الخدمات الطبية
          </button>
          <button
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'advice'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('advice')}
          >
            النصائح الطبية
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'services' ? 'إدارة الخدمات الطبية' : 'إدارة النصائح الطبية'}
          </h2>
          <button
            onClick={() => {
              setIsEditing(false);
              if (activeTab === 'services') {
                setServiceData({
                  name: "",
                  description: "",
                  category: "",
                  isActive: true,
                  comments: []
                });
              } else {
                setAdviceData({
                  title: "",
                  content: "",
                  category: "",
                  isActive: true,
                  comments: []
                });
              }
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {activeTab === 'services' ? 'إضافة خدمة جديدة' : 'إضافة نصيحة جديدة'}
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ابحث..."
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="flex gap-3">
            <button
              className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              <span>الفلاتر</span>
            </button>
            
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
              onClick={() => exportData(activeTab)}
            >
              <FaFileExport />
              <span>تصدير</span>
            </button>
            
            <label
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <FaFileImport />
              <span>استيراد</span>
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={(e) => importData(activeTab, e)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">إدارة التصنيفات</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="اسم التصنيف"
            className="border border-gray-300 py-2 px-4 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryData.name}
            onChange={(e) => setCategoryData({ name: e.target.value })}
            aria-label="Category name"
          />
          <button
            onClick={handleAddCategory}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200 ease-in-out disabled:opacity-50"
            disabled={isLoading}
          >
            إضافة تصنيف
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">التصنيفات الحالية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {categories.map(category => (
              <div key={category.id} className="bg-gray-100 p-3 rounded flex justify-between items-center">
                <span>{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      )}

      {deleteConfirmation.show && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">تأكيد الحذف</h3>
            <p className="mb-4">هل أنت متأكد من حذف هذا العنصر؟</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmation({ show: false, id: null, type: null })}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200 ease-in-out"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation.id, deleteConfirmation.type)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 ease-in-out"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments.id && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">التعليقات</h3>
            <div className="max-h-96 overflow-y-auto mb-4">
              {((showComments.type === "services" ? services : advice)
                .find(item => item.id === showComments.id)?.comments || [])
                .map(comment => (
                  <div key={comment.id} className="border-b py-2">
                    <p className="text-gray-800">{comment.text}</p>
                    <small className="text-gray-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))}
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="أضف تعليقاً..."
                className="border border-gray-300 py-2 px-4 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                aria-label="New comment"
              />
              <button
                onClick={() => handleAddComment(showComments.id, showComments.type)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200 ease-in-out disabled:opacity-50"
                disabled={isLoading}
              >
                إضافة
              </button>
              <button
                onClick={() => setShowComments({ id: null, type: null })}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200 ease-in-out"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold mb-3">الفلاتر</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select
                className="border border-gray-300 py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">جميع التصنيفات</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                className="border border-gray-300 py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب حسب</label>
              <div className="flex gap-2">
                <select
                  className="border border-gray-300 py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort by"
                >
                  <option value="name">الاسم</option>
                  <option value="description">الوصف</option>
                  <option value="category">التصنيف</option>
                </select>
                <select
                  className="border border-gray-300 py-2 px-4 rounded w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  aria-label="Sort order"
                >
                  <option value="asc">تصاعدي</option>
                  <option value="desc">تنازلي</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  {activeTab === 'services' ? 'اسم الخدمة' : 'عنوان النصيحة'}
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  {activeTab === 'services' ? 'الوصف' : 'المحتوى'}
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">التصنيف</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === 'services' ? filteredServices : filteredAdvice).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">{renderTableCell(item.name || item.title)}</td>
                  <td className="px-6 py-4">{renderTableCell(item.description || item.content)}</td>
                  <td className="px-6 py-4">
                    {renderTableCell(categories.find(c => c.id === item.category)?.name)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          editItem(item, activeTab === 'services' ? 'services' : 'tips');
                          setShowForm(true);
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                        disabled={isLoading}
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation({ 
                          show: true, 
                          id: item.id, 
                          type: activeTab === 'services' ? 'services' : 'tips' 
                        })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        disabled={isLoading}
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setIsEditing(false);
        }}
        type={activeTab}
        data={activeTab === 'services' ? serviceData : adviceData}
        isEditing={isEditing}
        onSubmit={activeTab === 'services' ? setServiceData : setAdviceData}
        isLoading={isLoading}
        categories={categories}
        handleSubmit={(type, data) => {
          if (type === 'services') {
            handleAddOrUpdate('services', data, setServiceData, setServices);
          } else {
            handleAddOrUpdate('tips', data, setAdviceData, setAdvice);
          }
        }}
      />
    </div>
  );
};

export default AdminServices;