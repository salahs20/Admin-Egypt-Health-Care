import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import AdminServices from "./AdminServices";

// مكون منفصل للصف في الجدول
const TableRow = ({ clinic, center, index, onEdit, onDelete }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors duration-200">
    <td className="py-4 px-6">{index + 1}</td>
    <td className="py-4 px-6 font-medium">{clinic.name}</td>
    <td className="py-4 px-6 text-gray-600">
      {clinic.address || "بدون عنوان"}
    </td>
    <td className="py-4 px-6 font-medium">{center?.name || "غير معروف"}</td>
    <td className="py-4 px-6 text-gray-600">
      {center?.address || "بدون عنوان"}
    </td>
    <td className="py-4 px-6">
      <button
        onClick={() => onEdit(clinic, center)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
      >
        تعديل
      </button>
    </td>
    <td className="py-4 px-6">
      <button
        onClick={() => onDelete(clinic.id)}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
      >
        حذف
      </button>
    </td>
  </tr>
);

// مكون النافذة المنبثقة
const EditModal = ({ isOpen, onClose, editData, setEditData, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">تعديل الموقع</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              اسم العيادة
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="تعديل اسم العيادة"
              value={editData.clinic}
              onChange={(e) =>
                setEditData({ ...editData, clinic: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              عنوان العيادة
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="تعديل عنوان العيادة"
              value={editData.clinicAddress || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  clinicAddress: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              اسم المركز
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="تعديل اسم المركز"
              value={editData.center}
              onChange={(e) =>
                setEditData({ ...editData, center: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              عنوان المركز
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="تعديل عنوان المركز"
              value={editData.centerAddress || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  centerAddress: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm font-medium"
          >
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
};

const ServiceTable = () => {
  const [provinces, setProvinces] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [centers, setCenters] = useState([]);
  const [locationData, setLocationData] = useState({
    province: "",
    clinic: "",
    center: "",
  });
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProvince, setNewProvince] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const provincesSnapshot = await getDocs(collection(db, "Provinces"));
      setProvinces(
        provincesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const clinicsSnapshot = await getDocs(collection(db, "Clinics"));
      setClinics(
        clinicsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const centersSnapshot = await getDocs(collection(db, "Centers"));
      setCenters(
        centersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchData();
  }, []);

  const handleAddProvince = async () => {
    if (!newProvince) return;
    try {
      const provinceRef = await addDoc(collection(db, "Provinces"), {
        name: newProvince,
      });
      setProvinces([...provinces, { id: provinceRef.id, name: newProvince }]);
      setNewProvince("");
    } catch (error) {
      console.error("Error adding province: ", error);
    }
  };

  const handleDeleteProvince = async (provinceId) => {
    try {
      const clinicsQuery = query(
        collection(db, "Clinics"),
        where("provinceId", "==", provinceId)
      );
      const clinicsSnapshot = await getDocs(clinicsQuery);
      const clinicIds = clinicsSnapshot.docs.map((doc) => doc.id);

      for (const clinicId of clinicIds) {
        await deleteDoc(doc(db, "Clinics", clinicId));
        setClinics((prev) => prev.filter((clinic) => clinic.id !== clinicId));

        const centersQuery = query(
          collection(db, "Centers"),
          where("clinicId", "==", clinicId)
        );
        const centersSnapshot = await getDocs(centersQuery);
        for (const centerDoc of centersSnapshot.docs) {
          await deleteDoc(doc(db, "Centers", centerDoc.id));
          setCenters((prev) =>
            prev.filter((center) => center.id !== centerDoc.id)
          );
        }
      }

      await deleteDoc(doc(db, "Provinces", provinceId));
      setProvinces((prev) =>
        prev.filter((province) => province.id !== provinceId)
      );
    } catch (error) {
      console.error("Error deleting province: ", error);
    }
  };

  const handleAddLocation = async () => {
    if (!locationData.province || !locationData.clinic || !locationData.center)
      return;
    try {
      const selectedProvince = provinces.find(
        (province) => province.name === locationData.province
      );

      if (!selectedProvince) {
        console.error("Province not found");
        return;
      }

      const clinicRef = await addDoc(collection(db, "Clinics"), {
        name: locationData.clinic,
        provinceId: selectedProvince.id,
        province: locationData.province,
      });
      const centerRef = await addDoc(collection(db, "Centers"), {
        name: locationData.center,
        clinicId: clinicRef.id,
        provinceId: selectedProvince.id,
        province: locationData.province,
      });

      setClinics([
        ...clinics,
        {
          id: clinicRef.id,
          name: locationData.clinic,
          provinceId: selectedProvince.id,
          province: locationData.province,
        },
      ]);
      setCenters([
        ...centers,
        {
          id: centerRef.id,
          name: locationData.center,
          clinicId: clinicRef.id,
          provinceId: selectedProvince.id,
          province: locationData.province,
        },
      ]);

      setLocationData({ province: "", clinic: "", center: "" });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleEditLocation = async () => {
    if (!editData.clinic || !editData.center) return;
    try {
      const clinicDoc = doc(db, "Clinics", editData.clinicId);
      await updateDoc(clinicDoc, {
        name: editData.clinic,
        address: editData.clinicAddress || "",
      });

      const centerDoc = doc(db, "Centers", editData.centerId);
      await updateDoc(centerDoc, {
        name: editData.center,
        address: editData.centerAddress || "",
      });

      setClinics(
        clinics.map((clinic) =>
          clinic.id === editData.clinicId
            ? {
                ...clinic,
                name: editData.clinic,
                address: editData.clinicAddress,
              }
            : clinic
        )
      );
      setCenters(
        centers.map((center) =>
          center.id === editData.centerId
            ? {
                ...center,
                name: editData.center,
                address: editData.centerAddress,
              }
            : center
        )
      );

      setEditData(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    try {
      await deleteDoc(doc(db, "Clinics", clinicId));
      setClinics(clinics.filter((clinic) => clinic.id !== clinicId));
      setCenters(centers.filter((center) => center.clinicId !== clinicId));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  return (
    <>
      <div className="pb-8 px-4 pe-[5rem] max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg ">
          <h2 className="text-3xl font-bold text-blue-800 mb-8 text-center">
            إدارة المحافظات والعيادات والمراكز
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  إضافة محافظة جديدة
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="اسم المحافظة الجديدة"
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                />
              </div>
              <button
                onClick={handleAddProvince}
                className="bg-green-500 hover:bg-green-600 text-white py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm font-medium"
              >
                إضافة محافظة
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  المحافظة
                </label>
                <select
                  className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={locationData.province}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      province: e.target.value,
                    })
                  }
                >
                  <option value="">اختر المحافظة</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  العيادة
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="اسم العيادة"
                  value={locationData.clinic}
                  onChange={(e) =>
                    setLocationData({ ...locationData, clinic: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  المركز
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="اسم المركز"
                  value={locationData.center}
                  onChange={(e) =>
                    setLocationData({ ...locationData, center: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              onClick={handleAddLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm font-medium"
            >
              إضافة موقع جديد
            </button>
          </div>
        </div>

        {provinces.map((province) => (
          <div
            key={province.id}
            className="bg-white p-8 rounded-xl shadow-lg mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {province.name}
              </h2>
              <button
                onClick={() => handleDeleteProvince(province.id)}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm font-medium"
              >
                حذف المحافظة
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-4 px-6 text-right font-semibold">#</th>
                    <th className="py-4 px-6 text-right font-semibold">
                      اسم العيادة
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      عنوان العيادة
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      اسم المركز
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      عنوان المركز
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      تعديل
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics
                    .filter((clinic) => clinic.provinceId === province.id)
                    .map((clinic, index) => {
                      const center = centers.find(
                        (center) => center.clinicId === clinic.id
                      );
                      return (
                        <TableRow
                          key={clinic.id}
                          clinic={clinic}
                          center={center}
                          index={index}
                          onEdit={(clinic, center) => {
                            setEditData({
                              clinicId: clinic.id,
                              clinic: clinic.name,
                              clinicAddress: clinic.address || "",
                              centerId: center?.id,
                              center: center?.name || "",
                              centerAddress: center?.address || "",
                            });
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteClinic}
                        />
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        setEditData={setEditData}
        onSave={handleEditLocation}
      />
    </>
  );
};

export default ServiceTable;
