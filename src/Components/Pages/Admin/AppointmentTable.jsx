import React, { useState, useEffect, useMemo } from "react";
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
import './Modal.css';

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const TableRow = React.memo(({ specialty, index, onEdit, onDelete }) => (
  <tr className="border-b hover:bg-gray-50">
    <td className="py-3 px-4 text-center">{index + 1}</td>
    <td className="py-3 px-4 text-center">{specialty.service}</td>
    <td className="py-3 px-4 text-center">{specialty.doctor}</td>
    <td className="py-3 px-4 text-center" dir="ltr">
      {formatDate(specialty.date)}
    </td>
    <td className="py-3 px-4 text-center">
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
        specialty.status === 'available' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {specialty.status === 'available' ? 'متاح' : 'محجوز'}
      </span>
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onEdit}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
          title="تعديل"
        >
          <span>تعديل</span>
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
          title="حذف"
        >
          <span>حذف</span>
        </button>
      </div>
    </td>
  </tr>
));

const AppointmentTable = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('#root');
    }
  }, []);

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
  const [formData, setFormData] = useState({
    service: "",
    doctor: "",
    date: "",
    location: "",
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
  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });
  const [searchClinicTerm, setSearchClinicTerm] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [filters, setFilters] = useState({
    date: '',
    specialty: '',
    doctor: '',
    governorate: '',
    status: 'all'
  });
  const [waitingList, setWaitingList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statistics, setStatistics] = useState({
    totalAppointments: 0,
    bookedAppointments: 0,
    availableSlots: 0,
    doctorStats: {},
    specialtyDistribution: {}
  });

  const handleEditAppointmentClick = (appointment) => {
    setEditAppointmentId(appointment.id);
    setFormData({
      service: appointment.service,
      date: appointment.date,
      specialtyId: appointment.specialtyId,
      doctor: appointment.doctor,
    });
  };

  const fetchAppointments = async () => {
    setStatus({ loading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "Date"));
      setAppointments(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setStatus({ loading: false });
    }
  };

  const fetchClinicsAndCenters = async () => {
    setStatus({ loading: true });
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
      setStatus({ loading: false });
    }
  };

  const fetchSpecialties = async (clinicOrCenterId) => {
    setStatus({ loading: true });
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
      setStatus({ loading: false });
    }
  };

  const fetchClinicOrCenterDetails = async (id) => {
    setStatus({ loading: true });
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
      setStatus({ loading: false });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStatus({ loading: true });
        await Promise.all([
          fetchAppointments(),
          fetchClinicsAndCenters()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setStatus({ loading: false });
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClinicOrCenter) {
      fetchSpecialties(selectedClinicOrCenter);
    }
  }, [selectedClinicOrCenter]);

  const handleAddAppointment = async () => {
    if (!formData.service || !formData.date) {
      setErrorMessage("يرجى إدخال الخدمة والتاريخ.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "Date"), formData);
      setAppointments([...appointments, { id: docRef.id, ...formData }]);
      setFormData({ service: "", date: "" });
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
    if (!formData.service || !formData.date) {
      setErrorMessage("يرجى إدخال الخدمة والتاريخ.");
      return;
    }
    try {
      const appointmentRef = doc(db, "Date", editAppointmentId);
      await updateDoc(appointmentRef, formData);
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === editAppointmentId
            ? { id: editAppointmentId, ...formData }
            : appointment
        )
      );
      setEditAppointmentId(null);
      setFormData({ service: "", date: "" });
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const checkDuplicateAppointment = (newDate, doctorId, specialtyId) => {
    if (!newDate || !doctorId || !specialtyId) return false;
    
    const newAppointmentDate = new Date(newDate);
    if (isNaN(newAppointmentDate.getTime())) return false;
    
    return specialties.some(specialty => {
      const existingDate = new Date(specialty.date);
      if (isNaN(existingDate.getTime())) return false;
      
      return specialty.doctor === doctorId &&
             specialty.service === specialtyId &&
             existingDate.getFullYear() === newAppointmentDate.getFullYear() &&
             existingDate.getMonth() === newAppointmentDate.getMonth() &&
             existingDate.getDate() === newAppointmentDate.getDate() &&
             existingDate.getHours() === newAppointmentDate.getHours();
    });
  };

  const handleAddSpecialty = async () => {
    try {
      if (!formData.service || !formData.doctor || !formData.date) {
        setErrorMessage("يرجى إدخال جميع الحقول المطلوبة");
        return;
      }

      if (checkDuplicateAppointment(
        formData.date,
        formData.doctor,
        formData.service
      )) {
        setErrorMessage("هذا الموعد محجوز مسبقاً للطبيب في نفس التخصص والوقت!");
        return;
      }

      setStatus({ loading: true });

      const appointmentData = {
        ...formData,
        clinicOrCenterId: selectedClinicOrCenter,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "Specialties"), appointmentData);
      
      setSpecialties(prev => [...prev, { 
        id: docRef.id, 
        ...appointmentData
      }]);
      
      setFormData({
        service: "",
        doctor: "",
        date: "",
      });
      
      setErrorMessage("");
      showNotification("تم إضافة الموعد بنجاح", "success");
    } catch (error) {
      console.error("Error adding specialty:", error);
      setErrorMessage("حدث خطأ أثناء إضافة الموعد");
    } finally {
      setStatus({ loading: false });
    }
  };

  const confirmAction = (message) => {
    return window.confirm(message);
  };

  const handleDeleteSpecialty = async (id) => {
    if (!confirmAction('هل أنت متأكد من حذف هذا الموعد؟')) {
      return;
    }
    try {
      await deleteDoc(doc(db, "Specialties", id));
      setSpecialties(prev => prev.filter(specialty => specialty.id !== id));
      showNotification("تم حذف الموعد بنجاح", "success");
    } catch (error) {
      handleError(error, "حدث خطأ أثناء حذف الموعد");
    }
  };

  const handleEditSpecialtyClick = (specialty) => {
    setEditAppointmentId(specialty.id);
    setFormData({
      service: specialty.service,
      doctor: specialty.doctor,
      date: specialty.date,
    });
  };

  const handleUpdateSpecialty = async () => {
    if (
      !formData.service ||
      !formData.doctor ||
      !formData.date
    ) {
      setErrorMessage("يرجى إدخال جميع الحقول.");
      return;
    }
    try {
      const specialtyRef = doc(db, "Specialties", editAppointmentId);
      await updateDoc(specialtyRef, formData);
      setSpecialties(
        specialties.map((specialty) =>
          specialty.id === editAppointmentId
            ? { id: editAppointmentId, ...formData }
            : specialty
        )
      );
      setEditAppointmentId(null);
      setFormData({ service: "", doctor: "", date: "" });
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

  const updateStatistics = () => {
    const stats = {
      totalAppointments: specialties.length,
      bookedAppointments: specialties.filter(s => s.status === 'booked').length,
      availableSlots: specialties.filter(s => s.status === 'available').length,
      doctorStats: specialties.reduce((acc, curr) => {
        acc[curr.doctor] = (acc[curr.doctor] || 0) + 1;
        return acc;
      }, {}),
      specialtyDistribution: specialties.reduce((acc, curr) => {
        acc[curr.service] = (acc[curr.service] || 0) + 1;
        return acc;
      }, {})
    };
    setStatistics(stats);
  };

  useEffect(() => {
    updateStatistics();
  }, [specialties]);

  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-blue-700">إجمالي المواعيد</h3>
        <p className="text-2xl font-bold  text-black">{statistics.totalAppointments}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-green-700">المواعيد المتاحة</h3>
        <p className="text-2xl font-bold  text-black">{statistics.availableSlots}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-yellow-700">المواعيد المحجوزة</h3>
        <p className="text-2xl font-bold  text-black">{statistics.bookedAppointments}</p>
      </div>
    </div>
  );

  const FilterSection = () => (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <input
        type="date"
        className="border border-gray-300 py-2 px-4 rounded"
        value={filters.date}
        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
      />
      <select
        className="border border-gray-300 py-2 px-4 rounded"
        value={filters.specialty}
        onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
      >
        <option value="">كل التخصصات</option>
        {[...new Set(specialties.map(s => s.service))].map(specialty => (
          <option key={specialty} value={specialty}>{specialty}</option>
        ))}
      </select>
      <select
        className="border border-gray-300 py-2 px-4 rounded"
        value={filters.doctor}
        onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
      >
        <option value="">كل الأطباء</option>
        {[...new Set(specialties.map(s => s.doctor))].map(doctor => (
          <option key={doctor} value={doctor}>{doctor}</option>
        ))}
      </select>
      <select
        className="border border-gray-300 py-2 px-4 rounded"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="all">كل الحالات</option>
        <option value="available">متاح</option>
        <option value="booked">محجوز</option>
      </select>
    </div>
  );

  const filteredSpecialties = useMemo(() => {
    return specialties.filter(specialty => {
      if (!specialty) return false;
      
      return (
        (!filters.date || new Date(specialty.date).toDateString() === new Date(filters.date).toDateString()) &&
        (!filters.specialty || specialty.service === filters.specialty) &&
        (!filters.doctor || specialty.doctor === filters.doctor) &&
        (filters.status === 'all' || specialty.status === filters.status)
      );
    });
  }, [specialties, filters]);

  const showNotification = (message, type = 'info') => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const handleError = (error, customMessage) => {
    console.error(error);
    setErrorMessage(customMessage || "حدث خطأ غير متوقع");
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const validateInput = (data) => {
    const errors = {};
    
    if (!data.service?.trim()) {
      errors.service = "يرجى إدخال التخصص";
    }
    
    if (!data.doctor?.trim()) {
      errors.doctor = "يرجى إدخال اسم الطبيب";
    }
    
    if (!data.date) {
      errors.date = "يرجى إدخال التاريخ والوقت";
    }
    
    return Object.keys(errors).length === 0 ? null : errors;
  };

  return (
    <div className="pb-8 px-4 pe-[5rem]">
      <div className="mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          إدارة التخصصات والمواعيد
        </h2>

        <StatisticsCards />

        <FilterSection />

        <select
          className="border border-gray-300 py-2 px-4 rounded w-full mb-4 bg-white text-gray-800 font-medium"
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
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  className="border border-gray-300 py-2 px-4 rounded w-full bg-white text-gray-800 font-medium"
                  placeholder="اسم التخصص"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="border border-gray-300 py-2 px-4 rounded w-full bg-white text-gray-800 font-medium"
                  placeholder="اسم الدكتور"
                  value={formData.doctor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      doctor: e.target.value,
                    })
                  }
                />
                <input
                  type="datetime-local"
                  className="border border-gray-300 py-2 px-4 rounded w-full bg-white text-gray-800 font-medium"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 font-medium">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={editAppointmentId ? handleUpdateSpecialty : handleAddSpecialty}
                disabled={status.loading}
                className={`${
                  status.loading
                    ? 'bg-gray-400'
                    : editAppointmentId
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white py-2 px-4 rounded w-full sm:w-auto font-medium`}
              >
                {status.loading
                  ? 'جاري المعالجة...'
                  : editAppointmentId
                  ? 'تحديث الموعد'
                  : 'إضافة موعد جديد'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                <thead className="bg-blue-100 text-blue-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4 text-center border-b border-gray-300">#</th>
                    <th className="py-3 px-4 text-center border-b border-gray-300">التخصص</th>
                    <th className="py-3 px-4 text-center border-b border-gray-300">الطبيب</th>
                    <th className="py-3 px-4 text-center border-b border-gray-300">التاريخ والوقت</th>
                    <th className="py-3 px-4 text-center border-b border-gray-300">الحالة</th>
                    <th className="py-3 px-4 text-center border-b border-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecialties.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500 font-medium">
                        لا توجد مواعيد متاحة
                      </td>
                    </tr>
                  ) : (
                    filteredSpecialties.map((specialty, index) => (
                      <tr
                        key={specialty.id}
                        className="border-b border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-gray-800">{index + 1}</td>
                        <td className="py-3 px-4 text-center text-gray-800">{specialty.service}</td>
                        <td className="py-3 px-4 text-center text-gray-800">{specialty.doctor}</td>
                        <td className="py-3 px-4 text-center text-gray-800" dir="ltr">
                          {formatDate(specialty.date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              specialty.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {specialty.status === 'available' ? 'متاح' : 'محجوز'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditSpecialtyClick(specialty)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                              title="تعديل"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteSpecialty(specialty.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                              title="حذف"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                <th className="py-3 px-4 text-center border-b">العيادة/المركز</th>
                {/* <th className="py-3 px-4 text-center border-b">المحافظة</th> */}
                <th className="py-3 px-4 text-center border-b">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinicsAndCenters.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">
                    لا توجد عيادات أو مراكز متاحة
                  </td>
                </tr>
              ) : (
                filteredClinicsAndCenters.map((clinicOrCenter) => (
                  <tr key={clinicOrCenter.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-center text-black">{clinicOrCenter.name}</td>
                    {/* <td className="py-3 px-4 text-center  text-black">{clinicOrCenter.governorate}</td> */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => fetchClinicOrCenterDetails(clinicOrCenter.id)}
                          className="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <span>عرض التفاصيل</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={!!selectedClinicOrCenterDetails}
          onRequestClose={() => setSelectedClinicOrCenterDetails(null)}
          contentLabel="تفاصيل العيادة أو المركز"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="relative">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-blue-700">
                تفاصيل العيادة أو المركز
              </h2>
              <button
                onClick={() => setSelectedClinicOrCenterDetails(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedClinicOrCenterDetails && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">المواعيد</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClinicOrCenterDetails.specialties.map((specialty) => (
                          <tr key={specialty.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-right text-black">
                              {formatDate(specialty.date)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                specialty.status === 'available' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {specialty.status === 'available' ? 'متاح' : 'محجوز'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleEditClick(specialty)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                تعديل
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">التخصصات</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التخصص</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الطبيب</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المواعيد المتاحة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClinicOrCenterDetails.specialties.map((specialty) => (
                          <tr key={specialty.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-right  text-black">{specialty.service}</td>
                            <td className="px-6 py-4 text-right  text-black">{specialty.doctor}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {selectedClinicOrCenterDetails.specialties.filter(
                                  s => s.service === specialty.service && s.status === 'available'
                                ).length}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedClinicOrCenterDetails(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      </div>
      {status.loading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
