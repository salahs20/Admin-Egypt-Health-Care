import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [serviceData, setServiceData] = useState({ name: "", description: "" });
  const [adviceData, setAdviceData] = useState({ title: "", content: "" });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesSnapshot = await getDocs(collection(db, "services"));
        setServices(
          servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        const adviceSnapshot = await getDocs(collection(db, "tips"));
        setAdvice(
          adviceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        setError("Error fetching data: " + error.message);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id, type) => {
    try {
      await deleteDoc(doc(db, type, id));
      if (type === "services") {
        setServices(services.filter((service) => service.id !== id));
      } else {
        setAdvice(advice.filter((item) => item.id !== id));
      }
    } catch (err) {
      setError("Error deleting: " + err.message);
    }
  };

  const handleAddOrUpdate = async (type, data, setData, setList) => {
    if (!Object.values(data).every(Boolean)) return;
    try {
      if (isEditing) {
        await updateDoc(doc(db, type, currentId), data);
        setList((prev) =>
          prev.map((item) => (item.id === currentId ? { id: currentId, ...data } : item))
        );
        setIsEditing(false);
        setCurrentId(null);
      } else {
        const ref = await addDoc(collection(db, type), data);
        setList((prev) => [...prev, { id: ref.id, ...data }]);
      }
      setData({ name: "", description: "" });
    } catch (error) {
      setError("Error adding/updating: " + error.message);
    }
  };

  const editItem = (item, type) => {
    if (type === "services") {
      setServiceData({ name: item.name, description: item.description });
    } else {
      setAdviceData({ title: item.title, content: item.content });
    }
    setIsEditing(true);
    setCurrentId(item.id);
  };

  return (
    <div className="pb-8 px-4 md:ps-[11rem]">
      {error && <p className="text-red-500">{error}</p>}
      {[
        {
          title: "الخدمات الطبية",
          type: "services",
          data: serviceData,
          setData: setServiceData,
          list: services,
          setList: setServices,
        },
        {
          title: "النصائح الطبية",
          type: "tips",
          data: adviceData,
          setData: setAdviceData,
          list: advice,
          setList: setAdvice,
        },
      ].map(({ title, type, data, setData, list, setList }) => (
        <div key={type} className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            إدارة {title}
          </h2>
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            placeholder={`عنوان ${title}`}
            value={data.name || data.title || ""}
            onChange={(e) =>
              setData({ ...data, name: e.target.value, title: e.target.value })
            }
          />
          <textarea
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            placeholder={`وصف ${title}`}
            value={data.description || data.content || ""}
            onChange={(e) =>
              setData({ ...data, description: e.target.value, content: e.target.value })
            }
          />
          <button
            onClick={() => handleAddOrUpdate(type, data, setData, setList)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-4"
          >
            {isEditing ? `تحديث ${title}` : `إضافة ${title}`}
          </button>
          <table className="w-full border border-gray-300 text-left mt-4">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4">العنوان</th>
                <th className="py-3 px-4">الوصف</th>
                <th className="py-3 px-5">تعديل</th>
                <th className="py-3 px-5">حذف</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">{item.name || item.title}</td>
                  <td className="py-3 px-4">{item.description || item.content}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => editItem(item, type)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      تعديل
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(item.id, type)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default AdminServices;