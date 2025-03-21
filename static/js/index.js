// Disable VideoJS help overlay
window.HELP_IMPROVE_VIDEOJS = false;

function initializePaginatedGallery(galleryData, selector) {
    const structure = `
        <div class="paginated-gallery">
            <h2 class="gallery-main-title"></h2>
            <div class="column-labels">
                <div class="col-label"></div>
                <div class="col-label"></div>
                <div class="col-label"></div>
                <div class="col-label"></div>
            </div>
            <div class="gallery-content">
                <div class="gallery-row">
                    <div class="row-label"></div>
                    <div class="media-row row1"></div>
                </div>
                <div class="gallery-row">
                    <div class="row-label"></div>
                    <div class="media-row row2"></div>
                </div>
            </div>
            <div class="gallery-navigation">
                <button class="nav-button prev-button" disabled>&larr;</button>
                <div class="page-numbers"></div>
                <button class="nav-button next-button">&rarr;</button>
            </div>
        </div>
    `;
    $(selector).html(structure);

    let currentPage = 0;
    const totalPages = galleryData.pages.length;

    function createMediaItem(item) {
        if (item.type === 'video') {
            return `
                <div class="media-item">
                    <video controls>
                        <source src="${item.src}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else {
            return `
                <div class="media-item">
                    <img src="${item.src}" alt="Gallery image">
                </div>
            `;
        }
    }

    function updatePageNumbers() {
        const pageNumbers = $('.page-numbers');
        pageNumbers.empty();
        
        for (let i = 0; i < totalPages; i++) {
            const pageButton = $(`<button class="page-number ${i === currentPage ? 'active' : ''}">${i + 1}</button>`);
            pageButton.click(() => {
                currentPage = i;
                renderPage();
            });
            pageNumbers.append(pageButton);
        }
    }

    function renderPage() {
        const currentPageData = galleryData.pages[currentPage];
        
        // Update title and labels for current page
        $('.gallery-main-title').text(currentPageData.title);
        
        // Update column labels
        $('.col-label').each((index, element) => {
            $(element).text(currentPageData.columnLabels[index]);
        });
        
        // Update row labels
        $('.row-label').each((index, element) => {
            $(element).text(currentPageData.rowLabels[index]);
        });

        // Render media content
        $('.row1').empty().append(currentPageData.row1.map(createMediaItem).join(''));
        $('.row2').empty().append(currentPageData.row2.map(createMediaItem).join(''));

        $('.prev-button').prop('disabled', currentPage === 0);
        $('.next-button').prop('disabled', currentPage === totalPages - 1);
        
        updatePageNumbers();
    }

    $('.prev-button').on('click', function() {
        if (currentPage > 0) {
            currentPage--;
            renderPage();
        }
    });

    $('.next-button').on('click', function() {
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderPage();
        }
    });

    renderPage();
}


function initializeImageComparison(normalGalleryData, wideGalleryData, selector) {
  const structure = `
      <div class="gallery-section normal-width">
          <h2 class="title">Comparison with Baselines: Ours Robust to Density/Noise/Sensor Types</h2>
          <div class="gallery gallery-top"></div>
          <div class="gallery gallery-bottom"></div>
      </div>
      <div class="gallery-section wide">
          <h2 class="title">Comparison with Baselines: Lidar & COLMAP</h2>
          <div class="gallery gallery-top"></div>
          <div class="gallery gallery-bottom"></div>
      </div>
  `;
  $(selector).html(structure);

  function createGalleryItems(images, gallerySelector) {
      images.forEach(function(image) {
          // Add class based on image width property
          const widthClass = image.isWide ? 'wide-image' : 'normal-image';
          
          const galleryItem = `
              <div class="image-comparison ${widthClass}">
                  <div class="after-image-container">
                      <img src="${image.after}" alt="After" style="margin:0; display:block;">
                      <div class="image-label after-label">${image.afterLabel || 'After'}</div>
                  </div>
                  <div class="before-image-container" style="width: 50%">
                      <div class="image-wrapper" style="width: 200%">
                          <img src="${image.before}" alt="Before" style="margin:0; display:block;">
                          <div class="image-label before-label">${image.beforeLabel || 'Before'}</div>
                      </div>
                  </div>
                  <div class="slider" style="left: 50%">
                      <div class="slider-handle">
                          <div class="slider-lines"></div>
                          <div class="slider-lines"></div>
                      </div>
                  </div>
              </div>
          `;
          $(gallerySelector).append(galleryItem);
      });
  }

    // Initialize both sections with their respective data
    createGalleryItems(normalGalleryData.topImages, `${selector} .gallery-section.normal-width .gallery-top`);
    createGalleryItems(normalGalleryData.bottomImages, `${selector} .gallery-section.normal-width .gallery-bottom`);
    createGalleryItems(wideGalleryData.topImages, `${selector} .gallery-section.wide .gallery-top`);
    createGalleryItems(wideGalleryData.bottomImages, `${selector} .gallery-section.wide .gallery-bottom`);

    // Initialize scroll sync for each section
    $('.gallery-section').each(function() {
        const $galleries = $(this).find('.gallery');
        let isGalleryDragging = false;
        let startX;
        let scrollLeft;

        $galleries.on('mousedown', function(e) {
            isGalleryDragging = true;
            $galleries.addClass('grabbing');
            startX = e.pageX - $(this).offset().left;
            scrollLeft = $(this).scrollLeft();
        });

        $(document).on('mouseup', function() {
            isGalleryDragging = false;
            $galleries.removeClass('grabbing');
        });

        $galleries.on('mousemove', function(e) {
            if (!isGalleryDragging) return;
            e.preventDefault();
            const x = e.pageX - $(this).offset().left;
            const walk = (x - startX) * 2;
            $galleries.scrollLeft(scrollLeft - walk);
        });

        // Sync scroll between galleries in this section
        $galleries.on('scroll', function() {
            const scrollLeft = $(this).scrollLeft();
            $galleries.not(this).scrollLeft(scrollLeft);
        });
    });

    // Initialize slider functionality
    $(`${selector} .image-comparison`).each(function() {
        let isSliderDragging = false;
        const $comparison = $(this);
        const $beforeContainer = $comparison.find('.before-image-container');
        const $imageWrapper = $comparison.find('.image-wrapper');
        const $slider = $comparison.find('.slider');

        $comparison.on('mousedown', '.slider', function(e) {
            isSliderDragging = true;
            e.stopPropagation();
        });

        $(document).on('mouseup', function() {
            isSliderDragging = false;
        });

        $comparison.on('mousemove', function(e) {
            if (!isSliderDragging) return;
            e.stopPropagation();

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const containerWidth = rect.width;
            
            const position = Math.max(0, Math.min(100, (x / containerWidth) * 100));
            
            $beforeContainer.css('width', `${position}%`);
            $imageWrapper.css('width', `${100 / (position/100)}%`);
            $slider.css('left', `${position}%`);
        });

        // Touch events
        $comparison.on('touchstart', '.slider', function(e) {
            isSliderDragging = true;
            e.stopPropagation();
        });

        $comparison.on('touchmove', function(e) {
            if (!isSliderDragging) return;
            e.stopPropagation();

            const rect = this.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const containerWidth = rect.width;
            
            const position = Math.max(0, Math.min(100, (x / containerWidth) * 100));
            
            $beforeContainer.css('width', `${position}%`);
            $imageWrapper.css('width', `${100 / (position/100)}%`);
            $slider.css('left', `${position}%`);
        });
    });
}

// Document ready initialization
$(document).ready(function() {
    // Navbar burger functionality
    $(".navbar-burger").click(function() {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });

    // Gallery data for normal width
    const normalGalleryData = {
        topImages: [
            {
                before: './static/images/pic1.png',
                after: './static/images/pic1ours.png',
                beforeLabel: '0.7% density',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic2.png',
                after: './static/images/pic2ours.png',
                beforeLabel: '0.1% density',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic3.png',
                after: './static/images/pic3ours.png',
                beforeLabel: '0.03% density',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic4.png',
                after: './static/images/pic4ours.png',
                beforeLabel: '5% Noise',
                afterLabel: 'Ours'
            },
            {
              before: './static/images/pic5.png',
              after: './static/images/pic5ours.png',
              beforeLabel: '10% Noise',
              afterLabel: 'Ours'
          },
          {
              before: './static/images/pic6.png',
              after: './static/images/pic6ours.png',
              beforeLabel: 'ORB',
              afterLabel: 'Ours'
          },
          {
              before: './static/images/pic7.png',
              after: './static/images/pic7ours.png',
              beforeLabel: 'SIFT',
              afterLabel: 'Ours'
          },
          {
              before: './static/images/pic8.png',
              after: './static/images/pic8ours.png',
              beforeLabel: 'Lidar 64',
              afterLabel: 'Ours'
          },
          {
            before: './static/images/pic9.png',
            after: './static/images/pic9ours.png',
            beforeLabel: 'Lidar 16',
            afterLabel: 'Ours'
        },
        {
            before: './static/images/pic10.png',
            after: './static/images/pic10ours.png',
            beforeLabel: 'Lidar 8',
            afterLabel: 'Ours'
        }
        ],
        bottomImages: [
            {
                before: './static/images/pic1G2MD.png',
                after: './static/images/pic1ours.png',
                beforeLabel: 'G2-MonoDepth',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic2g2md.png',
                after: './static/images/pic2ours.png',
                beforeLabel: 'G2-MonoDepth',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic3OGNIDC.png',
                after: './static/images/pic3ours.png',
                beforeLabel: 'OGNI-DC',
                afterLabel: 'Ours'
            },
            {
                before: './static/images/pic4OGNIDC.png',
                after: './static/images/pic4ours.png',
                beforeLabel: 'OGNI-DC',
                afterLabel: 'Ours'
            },
            {
              before: './static/images/pic5OGNIDC.png',
              after: './static/images/pic5ours.png',
              beforeLabel: 'OGNI-DC',
              afterLabel: 'Ours'
          },
          {
              before: './static/images/pic6g2md.png',
              after: './static/images/pic6ours.png',
              beforeLabel: 'G2-MonoDepth',
              afterLabel: 'Ours'
          },
          {
              before: './static/images/pic7OGNIDC.png',
              after: './static/images/pic7ours.png',
              beforeLabel: 'OGNI-DC',
              afterLabel: 'Ours'
          },
          {
            before: './static/images/pic8dav2.png',
            after: './static/images/pic8ours.png',
            beforeLabel: 'DepthAnything v2',
            afterLabel: 'Ours'
        },
        {
            before: './static/images/pic9g2md.png',
            after: './static/images/pic9ours.png',
            beforeLabel: 'G2-MonoDepth',
            afterLabel: 'Ours'
        },
        {
            before: './static/images/pic10g2md.png',
            after: './static/images/pic10ours.png',
            beforeLabel: 'G2-MonoDepth',
            afterLabel: 'Ours'
        }
        ]
    };

    // Gallery data for wide gallery
    const wideGalleryData = {
        topImages: [
            // Add your wide gallery images here
            {
              before: './static/images/pic11.png',
              after: './static/images/pic11ours.png',
              beforeLabel: 'ETH3D-SfM Indoor',
              afterLabel: 'Ours',
              isWide: false
          },
          {
              before: './static/images/pic12.png',
              after: './static/images/pic12ours.png',
              beforeLabel: 'ETH3D-SfM Outdoor',
              afterLabel: 'Ours',
              isWide: false
          },
            {
                before: './static/images/picreal1.png',
                after: './static/images/picreal1ours.png',
                beforeLabel: 'KITTI-LiDAR-64 Lines',
                afterLabel: 'Ours',
                isWide: true
            }
        ],
        bottomImages: [
            // Add your wide gallery images here
            {
              before: './static/images/pic11ognidc.png',
              after: './static/images/pic11ours.png',
              beforeLabel: 'OGNI-DC',
              afterLabel: 'Ours',
              isWide: false
          },
              {
                before: './static/images/pic12dav2.png',
                after: './static/images/pic12ours.png',
                beforeLabel: 'DepthAnything v2',
                afterLabel: 'Ours',
                isWide: false
            },
            {
              before: './static/images/picreal1ognidc.png',
              after: './static/images/picreal1ours.png',
              beforeLabel: 'OGNI-DC',
              afterLabel: 'Ours',
              isWide: true
          }
        ]
    };

    // Initialize the image comparison galleries
    initializeImageComparison(normalGalleryData, wideGalleryData, '.gallery-container');

    const galleryData = {
        pages: [
            {
                title: "Application: Sparse View Gaussian Splatting with Depth Supervision",
                columnLabels: ["Vanilla 3DGS", "ZoeDepth", "G2-Monodepth", "Ours"],
                rowLabels: ["Novel View RGB", "Novel View Depth"],
                row1: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_3dgs_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_zoe_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_g2md_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_ours_rgb.png'
                    }
                ],
                row2: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_3dgs_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_zoe_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_g2md_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene3_ours_depth.png'
                    }
                ]
            },
            // Page 1
            {
                title: "Application: Sparse View Gaussian Splatting with Depth Supervision",
                columnLabels: ["Vanilla 3DGS", "ZoeDepth", "G2-Monodepth", "Ours"],
                rowLabels: ["Novel View RGB", "Novel View Depth"],
                row1: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_3dgs_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_zoe_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_g2md_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_ours_rgb.png'
                    }
                ],
                row2: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_3dgs_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_zoe_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_g2md_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene1_ours_depth.png'
                    }
                ]
            },
            // Page 2
            {
                title: "Application: Sparse View Gaussian Splatting with Depth Supervision",
                columnLabels: ["Vanilla 3DGS", "ZoeDepth", "G2-Monodepth", "Ours"],
                rowLabels: ["Novel View RGB", "Novel View Depth"],
                row1: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_3dgs_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_zoe_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_g2md_rgb.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_ours_rgb.png'
                    }
                ],
                row2: [
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_3dgs_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_zoe_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_g2md_depth.png'
                    },
                    {
                        type: 'image',
                        src: './static/images/3dgs_scene2_ours_depth.png'
                    }
                ]
            },
            
            // Add more pages as needed...
        ]
    };

    initializePaginatedGallery(galleryData, '.paginated-gallery-container');
});