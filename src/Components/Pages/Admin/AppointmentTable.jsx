import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase/firebase"; // تأكد من استيراد إعدادات Firebase
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import Modal from "react-modal";
Modal.setAppElement("#root"); // أو أي عنصر رئيسي في تطبيقك

const AppointmentTable = () => {
  const handleSave = async () => {
    if (!editedData.service || !editedData.date) {
      setErrorMessage("يرجى إدخال الخدمة والتاريخ.");
      return;
    }
    try {
      const appointmentRef = doc(db, "Date", editedData.id);
      const docSnapshot = await getDoc(appointmentRef);
      if (!docSnapshot.exists()) {
        setErrorMessage("الموعد غير موجود.");
        return;
      }
      await updateDoc(appointmentRef, editedData);
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === editedData.id ? editedData : appointment
        )
      );
      setEditing(false);
      setEditedData(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleEditClick = (appointment) => {
    setEditing(true);
    setEditedData(appointment);
  };

  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newAppointment, setNewAppointment] = useState({
    service: "",
    doctor: "",
    date: "",
    location: "", // إذا كنت تستخدم حقل الموقع
  });
  const [editAppointmentId, setEditAppointmentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedClinicOrCenter, setSelectedClinicOrCenter] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [selectedClinicOrCenterDetails, setSelectedClinicOrCenterDetails] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [searchClinicTerm, setSearchClinicTerm] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");

  const handleEditAppointmentClick = (appointment) => {
    setEditAppointmentId(appointment.id);
    setNewAppointment({
      service: appointment.service,
      date: appointment.date,
      specialtyId: appointment.specialtyId,
      doctor: appointment.doctor,
    });
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Date"));
      setAppointments(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicsAndCenters = async () => {
    setLoading(true);
    try {
      const clinicsSnapshot = await getDocs(collection(db, "Clinics"));
      setClinics(
        clinicsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const centersSnapshot = await getDocs(collection(db, "Centers"));
      setCenters(
        centersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching clinics and centers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async (clinicOrCenterId) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Specialties"));
      setSpecialties(
        querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (specialty) => specialty.clinicOrCenterId === clinicOrCenterId
          )
      );
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicOrCenterDetails = async (id) => {
    setLoading(true);
    try {
      const appointmentsSnapshot = await getDocs(collection(db, "Date"));
      const specialtiesSnapshot = await getDocs(collection(db, "Specialties"));

      const appointments = appointmentsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((appointment) => appointment.clinicOrCenterId === id);
      const specialties = specialtiesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((specialty) => specialty.clinicOrCenterId === id);

      setSelectedClinicOrCenterDetails({ appointments, specialties });
    } catch (error) {
      console.error("Error fetching clinic or center details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchClinicsAndCenters();
  }, []);

  useEffect(() => {
    if (selectedClinicOrCenter) {
      fetchSpecialties(selectedClinicOrCenter);
    }
  }, [selectedClinicOrCenter]);

  const handleAddAppointment = async () => {
    if (!newAppointment.service || !newAppointment.date) {
      setErrorMessage("يرجى إدخال الخدمة والتاريخ.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "Date"), newAppointment);
      setAppointments([...appointments, { id: docRef.id, ...newAppointment }]);
      setNewAppointment({ service: "", date: "" });
      setErrorMessage("");
    } catch (error) {
      console.error("Error adding appointment:", error);
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await deleteDoc(doc(db, "Date", id));
      setAppointments(
        appointments.filter((appointment) => appointment.id !== id)
      );
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!newAppointment.service || !newAppointment.date) {
      setErrorMessage("يرجى إدخال الخدمة والتاريخ.");
      return;
    }
    try {
      const appointmentRef = doc(db, "Date", editAppointmentId);
      await updateDoc(appointmentRef, newAppointment);
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === editAppointmentId
            ? { id: editAppointmentId, ...newAppointment }
            : appointment
        )
      );
      setEditAppointmentId(null);
      setNewAppointment({ service: "", date: "" });
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleAddSpecialty = async () => {
    if (
      !newAppointment.service ||
      !newAppointment.doctor ||
      !newAppointment.date
    ) {
      setErrorMessage("يرجى إدخال جميع الحقول.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "Specialties"), {
        ...newAppointment,
        clinicOrCenterId: selectedClinicOrCenter,
      });
      setSpecialties([...specialties, { id: docRef.id, ...newAppointment }]);
      setNewAppointment({ service: "", doctor: "", date: "" });
      setErrorMessage("");
    } catch (error) {
      console.error("Error adding specialty:", error);
    }
  };

  const handleDeleteSpecialty = async (id) => {
    try {
      await deleteDoc(doc(db, "Specialties", id));
      setSpecialties(specialties.filter((specialty) => specialty.id !== id));
    } catch (error) {
      console.error("Error deleting specialty:", error);
    }
  };

  const handleEditSpecialtyClick = (specialty) => {
    setEditAppointmentId(specialty.id);
    setNewAppointment({
      service: specialty.service,
      doctor: specialty.doctor,
      date: specialty.date,
    });
  };

  const handleUpdateSpecialty = async () => {
    if (
      !newAppointment.service ||
      !newAppointment.doctor ||
      !newAppointment.date
    ) {
      setErrorMessage("يرجى إدخال جميع الحقول.");
      return;
    }
    try {
      const specialtyRef = doc(db, "Specialties", editAppointmentId);
      await updateDoc(specialtyRef, newAppointment);
      setSpecialties(
        specialties.map((specialty) =>
          specialty.id === editAppointmentId
            ? { id: editAppointmentId, ...newAppointment }
            : specialty
        )
      );
      setEditAppointmentId(null);
      setNewAppointment({ service: "", doctor: "", date: "" });
    } catch (error) {
      console.error("Error updating specialty:", error);
    }
  };

  const filteredClinicsAndCenters = [...clinics, ...centers].filter(
    (clinicOrCenter) =>
      clinicOrCenter.name.includes(searchClinicTerm) &&
      (selectedGovernorate
        ? clinicOrCenter.governorate === selectedGovernorate
        : true)
  );

  return (
    <div className="pb-8 px-4 md:ps-[11rem]">
      <div className="mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
          إدارة التخصصات والمواعيد
        </h2>
        <select
          className="border border-gray-300 py-2 px-4 rounded w-full mb-4"
          value={selectedClinicOrCenter}
          onChange={(e) => setSelectedClinicOrCenter(e.target.value)}
        >
          <option value="">اختر العيادة أو المركز</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.name}
            </option>
          ))}
        </select>

        {selectedClinicOrCenter && (
          <>
            <div className="mb-6">
              <div className="mb-4 flex flex-col sm:flex-row sm:gap-4">
                <input
                  type="text"
                  className="border border-gray-300 py-2 px-4 rounded w-full"
                  placeholder="اسم التخصص"
                  value={newAppointment.service || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      service: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="border border-gray-300 py-2 px-4 rounded w-full"
                  placeholder="اسم الدكتور"
                  value={newAppointment.doctor || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      doctor: e.target.value,
                    })
                  }
                />
                <input
                  type="datetime-local"
                  className="border border-gray-300 py-2 px-4 rounded w-full"
                  value={newAppointment.date || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <button
                onClick={
                  editAppointmentId ? handleUpdateSpecialty : handleAddSpecialty
                }
                className={`${
                  editAppointmentId ? "bg-blue-500" : "bg-green-500"
                } text-white py-2 px-4 rounded hover:opacity-90 w-full sm:w-auto`}
              >
                {editAppointmentId ? "تحديث التخصص" : "إضافة تخصص"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                <thead className="bg-blue-100 text-blue-700">
                  <tr>
                    <th className="py-3 px-4 text-left"></th>
                    <th className="py-3 px-4 text-left">التخصص</th>
                    <th className="py-3 px-4 text-left">اسم الدكتور</th>
                    <th className="py-3 px-4 text-left">التاريخ والوقت</th>
                    <th className="py-3 px-4 text-left">المحافظة</th> {/* إضافة عمود المحافظة */}
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {specialties.length > 0 ? (
                    specialties.map((specialty, index) => (
                      <tr key={specialty.id} className="border-b">
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">{specialty.service}</td>
                        <td className="py-3 px-4">{specialty.doctor}</td>
                        <td className="py-3 px-4">
                          {new Date(specialty.date).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">{specialty.governorate}</td> {/* إضافة خلية المحافظة */}
                        <td className="py-3 px-4 text-center flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditSpecialtyClick(specialty)}
                            className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteSpecialty(specialty.id)}
                            className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-3 text-gray-500">
                        لا توجد تخصصات.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-8">
          <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
            العيادات والمراكز
          </h2>
          <div className="mb-4 flex flex-col sm:flex-row sm:gap-4">
            <input
              type="text"
              className="border border-gray-300 py-2 px-4 rounded w-full"
              placeholder="بحث عن العيادة أو المركز"
              value={searchClinicTerm}
              onChange={(e) => setSearchClinicTerm(e.target.value)}
            />
          </div>
          <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
            <thead className="bg-blue-100 text-blue-700">
              <tr>
                <th className="py-3 px-4 text-left">العيادة/المركز</th>
                <th className="py-3 px-4 text-left">المحافظة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinicsAndCenters.map((clinicOrCenter) => (
                <tr key={clinicOrCenter.id} className="border-b">
                  <td className="py-3 px-4">{clinicOrCenter.name}</td>
                  <td className="py-3 px-4">{clinicOrCenter.governorate}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        fetchClinicOrCenterDetails(clinicOrCenter.id);
                      }}
                      className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
                    >
                      المزيد
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={!!selectedClinicOrCenterDetails}
          onRequestClose={() => setSelectedClinicOrCenterDetails(null)}
          contentLabel="تفاصيل العيادة أو المركز"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4 text-center">
              تفاصيل العيادة أو المركز
            </h2>
            {selectedClinicOrCenterDetails && (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">المواعيد</h3>
                  <ul className="list-disc list-inside">
                    {selectedClinicOrCenterDetails.specialties.map(
                      (specialty) => (
                        <li
                          key={specialty.id}
                          className="flex justify-between items-center"
                        >
                          {editing && editedData?.id === specialty.id ? (
                            <>
                              <input
                                type="text"
                                value={editedData.date}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    service: e.target.value,
                                  })
                                }
                                className="border px-2 py-1 rounded text-center"
                              />
                              <button
                                onClick={handleSave}
                                className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditing(false)}
                                className="bg-red-500 text-white px-2 py-1 rounded ml-2"
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              {` ${new Date(
                                specialty.date
                              ).toLocaleDateString()}`}
                              <button
                                onClick={() => handleEditClick(specialty)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded ml-2"
                              >
                                تعديل
                              </button>
                            </>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="mb-4 rounded-lg shadow-sm bg-white">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">
                    التخصصات
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 p-2 text-gray-700">
                            التخصص
                          </th>
                          <th className="border border-gray-300 p-2 text-gray-700">
                            الطبيب
                          </th>
                        
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClinicOrCenterDetails.specialties.map(
                          (specialty) => (
                            <tr key={specialty.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-2 text-gray-900 text-center">
                                {specialty.service}
                              </td>
                              <td className="border border-gray-300 p-2 text-gray-900 text-center">
                                {specialty.doctor}
                              </td>
                             
                              {/* <td className="border border-gray-300 p-2 text-center">
                                <button
                                  onClick={() => handleEditClick(specialty)}
                                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                                >
                                  تعديل
                                </button>
                              </td> */}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setSelectedClinicOrCenterDetails(null)}
              className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2"
            >
              إغلاق
            </button>
          </div>
        </Modal>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
