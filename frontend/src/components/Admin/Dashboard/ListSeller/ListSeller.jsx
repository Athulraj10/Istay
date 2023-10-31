import React, { useEffect, useState } from "react";
import { Container, Row,Button, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { USERSAPI } from "../../../AxiosAPI/AxiosInstance";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { SpinnerChakra } from "../../../loadingState/SpinnerChakra";

function ListSeller() {
  const navigate = useNavigate()
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // Add currentPage state
  const itemsPerPage = 10; // Number of items to display per page


  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);


  const handleBlockButton = async (sellerId) => {
    try {
      let response = await USERSAPI.patch(`admin/listSeller/block/${sellerId}`);
      if (response.data) {
        if(response.data.status==true){
          toast.error(response.data.message)
        }else{
          toast.success(response.data.message)
        }
      }
    }catch (error) {
      if (error.response) {
        // If the error has a response (status code), you can access the data.
        toast.error(error.response.data.error);
      } else {
        // Handle other types of errors here
        toast.error(error.message);
      }
    }
  };
  

  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo')
    if(adminInfo){
      const fetchData = async () => {
        try {
          const response = await USERSAPI.post("admin/listSellers");
          const responseData = response.data.data; 
          setData(responseData);
          setLoading(false);
        } catch (error) {
          toast.error(error.response.data.message);
          setLoading(false);
        }
      };
      fetchData();
    }else{
      navigate('/admin')
    }
  },[handleBlockButton]);


  return loading ? (
    <SpinnerChakra/>
  ):(
    <div style={{minHeight:'100vh'}} className="event-schedule-area-two p-4 rounded">
    <Container >
      <Row>
        <Col lg={12}>
          <div className="tab-content" id="myTabContent">
            <div
              className="tab-pane fade active show"
              id="home"
              role="tabpanel"
            >
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th className="text-center" scope="col">
                        Name
                      </th>
                      <th scope="col">Email</th>
                      <th scope="col">Location</th>
                      <th scope="col">LastCheckIn</th>
                      <th className="text-center" scope="col">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data) ? (
                      data.map((item, index) => (
                        <tr className="inner-box" key={index}>
                          <td className="align-middle">
                            <div className="event-date text-center">
                              <p className="date-month">{item.name}</p>
                            </div>
                          </td>
                          <td className="align-middle">
                            <div className="event-img">{item.email}</div>
                          </td>
                          <td className="align-middle">
                            <div className="event-wrap">
                              <h6>
                                <a style={{ textDecoration: "none" }}>
                                  {item.location ? item.location : "Kannur"}
                                </a>
                              </h6>

                              <div className="meta">
                                <div className="categories">
                                  <a style={{ textDecoration: "none" }}>
                                    Mobile : {item.mobile}
                                  </a>
                                </div>
                                <div className="time">
                                  <span>
                                    Account Created :{" "}
                                    {item.createdAt.substring(0, 10)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            <div className="r-no">
                              <span>{item.updatedAt.slice(0, 10)}</span>
                            </div>
                          </td>
                          <td className="align-middle text-center">
                            
                          <Button
                          type="button"
                                onClick={() => handleBlockButton(item._id)} // Pass item._id as a parameter
                                className={`btn ${ item.isBlock ? "btn-outline-danger" : "btn-outline-success"}`}
                              >
                             {item.isBlock ? 'Blocked' : 'Block' }
                              </Button>

                             </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">Loading data...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Col>
      </Row>
     <Row>
     <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={Math.ceil(data.length / itemsPerPage)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageChange}
        containerClassName={"pagination"}
        subContainerClassName={"pages pagination"}
        activeClassName={"active"}
      />
     </Row>
    </Container>
  </div>
  )
}

export default ListSeller;
