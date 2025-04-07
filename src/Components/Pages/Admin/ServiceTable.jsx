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
      setProvinces([
        ...provinces,
        { id: provinceRef.id, name: newProvince },
      ]);
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
          setCenters((prev) => prev.filter((center) => center.id !== centerDoc.id));
        }
      }

      await deleteDoc(doc(db, "Provinces", provinceId));
      setProvinces((prev) => prev.filter((province) => province.id !== provinceId));
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
      await updateDoc(clinicDoc, { name: editData.clinic });

      const centerDoc = doc(db, "Centers", editData.centerId);
      await updateDoc(centerDoc, { name: editData.center });

      setClinics(
        clinics.map((clinic) =>
          clinic.id === editData.clinicId
            ? { ...clinic, name: editData.clinic }
            : clinic
        )
      );
      setCenters(
        centers.map((center) =>
          center.id === editData.centerId
            ? { ...center, name: editData.center }
            : center
        )
      );

      setEditData(null);
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
      <div className="pb-8 px-4 md:ps-[11rem]">
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
            إدارة المحافظات والعيادات والمراكز
          </h2>
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            placeholder="اسم المحافظة الجديدة"
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
          />
          <button
            onClick={handleAddProvince}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-4"
          >
            إضافة محافظة جديدة
          </button>
          <select
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            value={locationData.province}
            onChange={(e) =>
              setLocationData({ ...locationData, province: e.target.value })
            }
          >
            <option value="">اختر المحافظة</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            placeholder="اسم العيادة"
            value={locationData.clinic}
            onChange={(e) =>
              setLocationData({ ...locationData, clinic: e.target.value })
            }
          />
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
            placeholder="اسم المركز"
            value={locationData.center}
            onChange={(e) =>
              setLocationData({ ...locationData, center: e.target.value })
            }
          />
          <button
            onClick={handleAddLocation}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-4"
          >
            إضافة موقع جديد
          </button>
          {editData && (
            <>
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
                placeholder="تعديل اسم العيادة"
                value={editData.clinic}
                onChange={(e) =>
                  setEditData({ ...editData, clinic: e.target.value })
                }
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
                placeholder="تعديل اسم المركز"
                value={editData.center}
                onChange={(e) =>
                  setEditData({ ...editData, center: e.target.value })
                }
              />
              <button
                onClick={handleEditLocation}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-4"
              >
                تعديل الموقع
              </button>
            </>
          )}
        </div>

        {provinces.map((province) => (
          <div key={province.id} className="bg-white p-6 rounded-lg shadow-lg mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">
                {province.name}
              </h2>
              <button
                onClick={() => handleDeleteProvince(province.id)}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded mb-4"
              >
                حذف
              </button>
            </div>

            <table className="w-full border border-gray-300 text-left mb-4">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="py-3 px-4"></th>
                  <th className="py-3 px-4">العيادة</th>
                  <th className="py-3 px-4">المركز</th>
                  <th className="py-3 px-5">تعديل</th>
                  <th className="py-3 px-5">حذف</th>
                </tr>
              </thead>
              <tbody>
                {clinics
                  .filter((clinic) => clinic.provinceId === province.id)
                  .map((clinic, index) => (
                    <tr key={clinic.id} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{clinic.name}</td>
                      <td className="py-3 px-4">
                        {centers
                          .filter((center) => center.clinicId === clinic.id)
                          .map((center) => center.name)
                          .join(", ") || "غير معروف"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            setEditData({
                              clinicId: clinic.id,
                              clinic: clinic.name,
                              centerId: centers.find(
                                (center) => center.clinicId === clinic.id
                              )?.id,
                              center: centers.find(
                                (center) => center.clinicId === clinic.id
                              )?.name,
                            })
                          }
                          className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                        >
                          تعديل
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteClinic(clinic.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
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
      <AdminServices />
    </>
  );
};

export default ServiceTable;
